from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from ..catalog.service import CatalogService
from ..core.errors import ApiException
from ..core.security import AuthenticatedUser, UserRole
from ..models import (
    FulfillmentType,
    Order,
    OrderItem,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    Reservation,
    ReservationStatus,
)
from .schemas import (
    OrderCreateRequest,
    OrderItemResponse,
    OrderResponse,
    OrderUpdateRequest,
    ReservationCreateRequest,
    ReservationResponse,
    ReservationUpdateRequest,
)

@dataclass
class _PreparedOrderItem:
    """Intermediate representation carrying both request data and menu-item-derived fields."""
    menu_item_id: str
    name: str
    quantity: int
    unit_price_cents: int
    note: str | None


ACTIVE_RESERVATION_CONFLICT_MESSAGE = "Já existe uma reserva ativa para esta filial, horário e nível."
RESERVATION_ACCESS_DENIED_MESSAGE = "Acesso à reserva negado."
RESERVATION_ACCESS_DENIED_FOR_ORDER_MESSAGE = "Acesso à reserva negado para este pedido."
ORDER_ACCESS_DENIED_MESSAGE = "Acesso ao pedido negado."


class OperationsService:
    def __init__(self, deps):
        self.deps = deps

    def list_reservations(self, user: AuthenticatedUser, status: str | None) -> list[ReservationResponse]:
        session = self.deps.session
        query = select(Reservation).order_by(Reservation.scheduled_at.asc())
        if status is not None:
            query = query.where(Reservation.status == _parse_reservation_status(status))
        if user.role.upper() != UserRole.ADMIN.value.upper():
            query = query.where(Reservation.user_id == user.id)
        reservations = session.scalars(query).all()
        return [self.to_reservation_response(reservation) for reservation in reservations]

    def get_reservation(self, reservation_id: str, user: AuthenticatedUser) -> ReservationResponse:
        reservation = self._find_reservation(reservation_id)
        self._assert_ownership_or_admin(user, reservation.user_id, RESERVATION_ACCESS_DENIED_MESSAGE)
        return self.to_reservation_response(reservation)

    def create_reservation(self, request: ReservationCreateRequest, user: AuthenticatedUser) -> ReservationResponse:
        catalog = CatalogService(self.deps)
        branch = catalog._find_branch(request.branchId)
        depth_level = request.depthLevel.strip()
        if depth_level not in {depth.depth_level for depth in branch.reservation_depths}:
            raise ApiException(400, "A filial selecionada não suporta este nível.")

        self._ensure_reservation_slot_is_available(request.branchId, request.scheduledAt, depth_level, None)

        reservation = Reservation(
            user_id=user.id,
            branch_id=request.branchId,
            branch_name_snapshot=branch.name,
            scheduled_at=request.scheduledAt,
            guests=request.guests,
            depth_level=depth_level,
            status=ReservationStatus.CONFIRMED.value,
            special_request_encrypted=self.deps.crypto.encrypt(_normalize_optional(request.specialRequest)),
        )
        session = self.deps.session
        session.add(reservation)
        try:
            session.commit()
        except IntegrityError as exc:  # pragma: no cover - database guard
            session.rollback()
            raise ApiException(409, ACTIVE_RESERVATION_CONFLICT_MESSAGE) from exc
        session.refresh(reservation)
        return self.to_reservation_response(reservation)

    def update_reservation(self, reservation_id: str, request: ReservationUpdateRequest, user: AuthenticatedUser) -> ReservationResponse:
        reservation = self._find_reservation(reservation_id)
        self._assert_ownership_or_admin(user, reservation.user_id, RESERVATION_ACCESS_DENIED_MESSAGE)

        next_status = reservation.status
        if request.status is not None:
            parsed = _parse_reservation_status(request.status)
            if user.role.upper() != UserRole.ADMIN.value.upper() and parsed != ReservationStatus.CANCELLED.value:
                raise ApiException(403, "Apenas administradores podem aplicar este status de reserva.")
            next_status = parsed

        next_branch_id = request.branchId or reservation.branch_id
        next_depth_level = request.depthLevel.strip() if request.depthLevel is not None else reservation.depth_level
        next_scheduled_at = request.scheduledAt or reservation.scheduled_at

        if request.branchId is not None or request.depthLevel is not None:
            catalog = CatalogService(self.deps)
            branch = catalog._find_branch(next_branch_id)
            if next_depth_level not in {depth.depth_level for depth in branch.reservation_depths}:
                raise ApiException(400, "A filial selecionada não suporta este nível.")
            reservation.branch_id = next_branch_id
            reservation.branch_name_snapshot = branch.name
            reservation.depth_level = next_depth_level

        if request.scheduledAt is not None:
            reservation.scheduled_at = request.scheduledAt
        if request.guests is not None:
            reservation.guests = request.guests
        if request.status is not None:
            reservation.status = next_status
        if request.specialRequest is not None:
            reservation.special_request_encrypted = self.deps.crypto.encrypt(_normalize_optional(request.specialRequest))

        if reservation.status != ReservationStatus.CANCELLED.value:
            self._ensure_reservation_slot_is_available(next_branch_id, next_scheduled_at, next_depth_level, reservation.id)

        session = self.deps.session
        session.commit()
        session.refresh(reservation)
        return self.to_reservation_response(reservation)

    def delete_reservation(self, reservation_id: str, user: AuthenticatedUser) -> None:
        reservation = self._find_reservation(reservation_id)
        self._assert_ownership_or_admin(user, reservation.user_id, RESERVATION_ACCESS_DENIED_MESSAGE)
        session = self.deps.session
        session.delete(reservation)
        session.commit()

    def list_orders(self, user: AuthenticatedUser, status: str | None) -> list[OrderResponse]:
        session = self.deps.session
        query = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
        if status is not None:
            query = query.where(Order.status == _parse_order_status(status))
        if user.role.upper() != UserRole.ADMIN.value.upper():
            query = query.where(Order.user_id == user.id)
        orders = session.scalars(query).all()
        return [self.to_order_response(order) for order in orders]

    def get_order(self, order_id: str, user: AuthenticatedUser) -> OrderResponse:
        order = self._find_order(order_id)
        self._assert_ownership_or_admin(user, order.user_id, ORDER_ACCESS_DENIED_MESSAGE)
        return self.to_order_response(order)

    def create_order(self, request: OrderCreateRequest, user: AuthenticatedUser) -> OrderResponse:
        fulfillment_type = _parse_fulfillment_type(request.fulfillmentType)
        payment_method = _parse_payment_method(request.paymentMethod)
        if fulfillment_type == FulfillmentType.DELIVERY.value and not request.deliveryAddress:
            raise ApiException(400, "O endereço de entrega é obrigatório para pedidos de entrega.")

        branch_id = request.branchId
        branch_name = None
        reservation = None
        if request.reservationId is not None:
            reservation = self._find_reservation(request.reservationId)
            self._assert_ownership_or_admin(user, reservation.user_id, RESERVATION_ACCESS_DENIED_FOR_ORDER_MESSAGE)
            if branch_id is None:
                branch_id = reservation.branch_id
                branch_name = reservation.branch_name_snapshot
            elif branch_id != reservation.branch_id:
                raise ApiException(400, "A filial da reserva deve corresponder à filial selecionada.")

        if fulfillment_type == FulfillmentType.DINE_IN.value and branch_id is None:
            raise ApiException(400, "branchId é obrigatório para pedidos no local.")

        if branch_id is not None and branch_name is None:
            branch = CatalogService(self.deps)._find_branch(branch_id)
            branch_name = branch.name

        menu_ids = list(dict.fromkeys(item.menuItemId for item in request.items))
        menu_items = {item.id: item for item in CatalogService(self.deps).lookup_menu_items(menu_ids)}

        order_items: list[_PreparedOrderItem] = [
            self._to_order_item(item, menu_items, fulfillment_type)
            for item in request.items
        ]
        total_cents = sum(oi.quantity * oi.unit_price_cents for oi in order_items)

        order = Order(
            user_id=user.id,
            branch_id=branch_id,
            branch_name_snapshot=branch_name,
            reservation_id=None if reservation is None else reservation.id,
            fulfillment_type=fulfillment_type,
            status=OrderStatus.PENDING.value,
            payment_method=payment_method,
            payment_status=PaymentStatus.AUTHORIZED.value if payment_method == PaymentMethod.IN_APP_CARD_TOKENIZED.value else PaymentStatus.PENDING.value,
            delivery_address_encrypted=self.deps.crypto.encrypt(_normalize_optional(request.deliveryAddress)),
            contact_name_encrypted=self.deps.crypto.encrypt(_normalize_optional(request.contactName)),
            total_cents=total_cents,
            items=[],
        )
        for oi in order_items:
            order.items.append(
                OrderItem(
                    menu_item_id=oi.menu_item_id,
                    name_snapshot=oi.name,
                    quantity=oi.quantity,
                    unit_price_cents=oi.unit_price_cents,
                    note_encrypted=self.deps.crypto.encrypt(_normalize_optional(oi.note)),
                )
            )

        session = self.deps.session
        session.add(order)
        session.commit()
        session.refresh(order)
        return self.to_order_response(order)

    def update_order(self, order_id: str, request: OrderUpdateRequest, user: AuthenticatedUser) -> OrderResponse:
        order = self._find_order(order_id)
        self._assert_ownership_or_admin(user, order.user_id, ORDER_ACCESS_DENIED_MESSAGE)

        if user.role.upper() != UserRole.ADMIN.value.upper() and request.paymentStatus is not None:
            raise ApiException(403, "Apenas administradores podem atualizar o status de pagamento.")
        if user.role.upper() != UserRole.ADMIN.value.upper() and request.status is not None and _parse_order_status(request.status) != OrderStatus.CANCELLED.value:
            raise ApiException(403, "Apenas administradores podem aplicar este status do pedido.")

        if request.status is not None:
            order.status = _parse_order_status(request.status)
        if request.paymentStatus is not None:
            order.payment_status = _parse_payment_status(request.paymentStatus)

        session = self.deps.session
        session.commit()
        session.refresh(order)
        return self.to_order_response(order)

    def delete_order(self, order_id: str, user: AuthenticatedUser) -> None:
        order = self._find_order(order_id)
        self._assert_ownership_or_admin(user, order.user_id, ORDER_ACCESS_DENIED_MESSAGE)
        session = self.deps.session
        session.delete(order)
        session.commit()

    def to_reservation_response(self, reservation: Reservation) -> ReservationResponse:
        return ReservationResponse(
            id=reservation.id,
            userId=reservation.user_id,
            branchId=reservation.branch_id,
            branchName=reservation.branch_name_snapshot,
            scheduledAt=reservation.scheduled_at,
            guests=reservation.guests,
            depthLevel=reservation.depth_level,
            status=reservation.status,
            specialRequest=self.deps.crypto.decrypt(reservation.special_request_encrypted),
        )

    def to_order_response(self, order: Order) -> OrderResponse:
        return OrderResponse(
            id=order.id,
            userId=order.user_id,
            branchId=order.branch_id,
            branchName=order.branch_name_snapshot,
            reservationId=order.reservation_id,
            fulfillmentType=order.fulfillment_type,
            status=order.status,
            paymentMethod=order.payment_method,
            paymentStatus=order.payment_status,
            totalCents=order.total_cents,
            deliveryAddress=self.deps.crypto.decrypt(order.delivery_address_encrypted),
            contactName=self.deps.crypto.decrypt(order.contact_name_encrypted),
            items=[
                OrderItemResponse(
                    menuItemId=item.menu_item_id,
                    name=item.name_snapshot,
                    quantity=item.quantity,
                    unitPriceCents=item.unit_price_cents,
                    note=self.deps.crypto.decrypt(item.note_encrypted),
                )
                for item in order.items
            ],
            createdAt=order.created_at,
        )

    def _find_reservation(self, reservation_id: str) -> Reservation:
        session = self.deps.session
        reservation = session.scalar(select(Reservation).where(Reservation.id == reservation_id))
        if reservation is None:
            raise ApiException(404, "Reserva não encontrada.")
        return reservation

    def _find_order(self, order_id: str) -> Order:
        session = self.deps.session
        order = session.scalar(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
        if order is None:
            raise ApiException(404, "Pedido não encontrado.")
        return order

    def _ensure_reservation_slot_is_available(self, branch_id: str, scheduled_at: datetime, depth_level: str, excluded_reservation_id: str | None) -> None:
        session = self.deps.session
        query = select(Reservation).where(
            Reservation.branch_id == branch_id,
            Reservation.scheduled_at == scheduled_at,
            Reservation.depth_level == depth_level,
            Reservation.status != ReservationStatus.CANCELLED.value,
        )
        if excluded_reservation_id is not None:
            query = query.where(Reservation.id != excluded_reservation_id)

        if session.scalar(query) is not None:
            raise ApiException(409, ACTIVE_RESERVATION_CONFLICT_MESSAGE)

    def _to_order_item(self, item, menu_items, fulfillment_type: str) -> _PreparedOrderItem:
        menu_item = menu_items.get(item.menuItemId)
        if menu_item is None:
            raise ApiException(400, "Um ou mais itens do menu são inválidos.")
        if fulfillment_type == FulfillmentType.DELIVERY.value and not menu_item.availableForDelivery:
            raise ApiException(400, "Um ou mais itens do menu não estão disponíveis para entrega.")
        if fulfillment_type == FulfillmentType.DINE_IN.value and not menu_item.availableForDineIn:
            raise ApiException(400, "Um ou mais itens do menu não estão disponíveis para consumo no local.")
        return _PreparedOrderItem(
            menu_item_id=item.menuItemId,
            name=menu_item.name,
            quantity=item.quantity,
            unit_price_cents=menu_item.priceCents,
            note=item.note,
        )

    @staticmethod
    def _assert_ownership_or_admin(user: AuthenticatedUser, resource_user_id: str, message: str) -> None:
        if user.role.upper() != UserRole.ADMIN.value.upper() and user.id != resource_user_id:
            raise ApiException(403, message)


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _parse_reservation_status(value: str) -> str:
    try:
        return ReservationStatus(value).value
    except ValueError as exc:
        raise ApiException(400, "o status deve ser um de confirmed, checked_in, completed ou cancelled.") from exc


def _parse_order_status(value: str) -> str:
    try:
        return OrderStatus(value).value
    except ValueError as exc:
        raise ApiException(400, "o status deve ser um de pending, preparing, on_the_way, served, completed ou cancelled.") from exc


def _parse_payment_status(value: str) -> str:
    try:
        return PaymentStatus(value).value
    except ValueError as exc:
        raise ApiException(400, "o status de pagamento deve ser um de pending, authorized ou paid.") from exc


def _parse_payment_method(value: str) -> str:
    try:
        return PaymentMethod(value).value
    except ValueError as exc:
        raise ApiException(400, "o método de pagamento deve ser um de in_app_card_tokenized, card_on_delivery, on_site.") from exc


def _parse_fulfillment_type(value: str) -> str:
    try:
        return FulfillmentType(value).value
    except ValueError as exc:
        raise ApiException(400, "o tipo de atendimento deve ser delivery ou dine_in.") from exc
