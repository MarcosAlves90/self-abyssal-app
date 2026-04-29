from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .errors import ApiException
from .models import (
    Branch,
    BranchReservationDepth,
    FulfillmentType,
    MenuItem,
    Order,
    OrderItem,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    Reservation,
    ReservationStatus,
    User,
    UserAddress,
    UserRole,
)
from .schemas import (
    AddressResponse,
    AddressUpsertRequest,
    AuthResponse,
    BranchResponse,
    BranchUpdateRequest,
    BranchUpsertRequest,
    InternalBranchResponse,
    InternalMenuItemResponse,
    LoginRequest,
    MenuItemResponse,
    MenuItemUpdateRequest,
    MenuItemUpsertRequest,
    OrderCreateRequest,
    OrderItemResponse,
    OrderResponse,
    OrderUpdateRequest,
    RegisterRequest,
    ReservationCreateRequest,
    ReservationResponse,
    ReservationUpdateRequest,
    UserResponse,
)
from .security import AuthenticatedUser, HashingService, JwtService, TextCrypto, hash_password, verify_password

ACTIVE_RESERVATION_CONFLICT_MESSAGE = "Já existe uma reserva ativa para esta filial, horário e nível."
RESERVATION_ACCESS_DENIED_MESSAGE = "Acesso à reserva negado."
RESERVATION_ACCESS_DENIED_FOR_ORDER_MESSAGE = "Acesso à reserva negado para este pedido."
ORDER_ACCESS_DENIED_MESSAGE = "Acesso ao pedido negado."


@dataclass(slots=True)
class AppServices:
    session: Session
    jwt: JwtService
    crypto: TextCrypto
    hashing: HashingService


class AuthService:
    def __init__(self, deps: AppServices):
        self.deps = deps

    def register(self, request: RegisterRequest) -> AuthResponse:
        session = self.deps.session
        normalized_email = request.email.strip().lower()
        email_hash = self.deps.hashing.sha256(normalized_email)

        if session.scalar(select(User).where(User.email_hash == email_hash)) is not None:
            raise ApiException(409, "Já existe uma conta com este e-mail.")

        user = User(
            name=request.name.strip(),
            email_hash=email_hash,
            email_encrypted=self.deps.crypto.encrypt(normalized_email),
            password_hash=hash_password(request.password),
            phone_encrypted=self.deps.crypto.encrypt(request.phone.strip()),
            role=UserRole.CUSTOMER.value,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return AuthResponse(token=self.deps.jwt.generate(user.id, user.role.upper()), user=self.to_user_response(user))

    def login(self, request: LoginRequest) -> AuthResponse:
        session = self.deps.session
        normalized_email = request.email.strip().lower()
        email_hash = self.deps.hashing.sha256(normalized_email)
        user = session.scalar(select(User).where(User.email_hash == email_hash))

        if user is None or not verify_password(request.password, user.password_hash):
            raise ApiException(401, "E-mail ou senha inválidos.")

        return AuthResponse(token=self.deps.jwt.generate(user.id, user.role.upper()), user=self.to_user_response(user))

    def get_current_user(self, user_id: str) -> UserResponse:
        user = self._find_user(user_id)
        return self.to_user_response(user)

    def save_primary_address(self, user_id: str, request: AddressUpsertRequest) -> UserResponse:
        user = self._find_user(user_id)
        session = self.deps.session

        session.execute(delete(UserAddress).where(UserAddress.user_id == user.id))
        address = UserAddress(
            user_id=user.id,
            label=(request.label or "Principal").strip(),
            postal_code_encrypted=self.deps.crypto.encrypt(_normalize_postal_code(request.postalCode)),
            street_encrypted=self.deps.crypto.encrypt(request.street.strip()),
            number_encrypted=self.deps.crypto.encrypt(request.number.strip()),
            complement_encrypted=self.deps.crypto.encrypt(_normalize_optional(request.complement)),
            neighborhood_encrypted=self.deps.crypto.encrypt(request.neighborhood.strip()),
            city_encrypted=self.deps.crypto.encrypt(request.city.strip()),
            state_encrypted=self.deps.crypto.encrypt(request.state.strip().upper()),
            summary_encrypted=self.deps.crypto.encrypt(_build_address_summary(request)),
            is_primary=True,
        )
        session.add(address)
        session.commit()
        return self.get_current_user(user.id)

    def authenticate_header(self, authorization_header: str | None) -> AuthenticatedUser:
        if not authorization_header or not authorization_header.startswith("Bearer "):
            raise ApiException(401, "Token de autenticação é obrigatório.")

        token = authorization_header.removeprefix("Bearer ").strip()
        user_id, role = self.deps.jwt.parse(token)
        user = self._find_user(user_id)
        if user.role.upper() != role.upper():
            raise ApiException(401, "Token de autenticação inválido.")
        return AuthenticatedUser(id=user.id, role=user.role)

    def _find_user(self, user_id: str) -> User:
        session = self.deps.session
        user = session.scalar(select(User).where(User.id == user_id).options(selectinload(User.addresses)))
        if user is None:
            raise ApiException(404, "Usuário autenticado não encontrado.")
        return user

    def to_user_response(self, user: User) -> UserResponse:
        addresses = sorted(user.addresses, key=lambda address: not address.is_primary)
        return UserResponse(
            id=user.id,
            name=user.name,
            email=self.deps.crypto.decrypt(user.email_encrypted) or "",
            role=user.role,
            savedAddresses=[self.to_address_response(address) for address in addresses],
        )

    def to_address_response(self, address: UserAddress) -> AddressResponse:
        return AddressResponse(
            label=address.label,
            postalCode=_format_postal_code(self.deps.crypto.decrypt(address.postal_code_encrypted) or ""),
            street=self.deps.crypto.decrypt(address.street_encrypted) or "",
            number=self.deps.crypto.decrypt(address.number_encrypted) or "",
            complement=self.deps.crypto.decrypt(address.complement_encrypted),
            neighborhood=self.deps.crypto.decrypt(address.neighborhood_encrypted) or "",
            city=self.deps.crypto.decrypt(address.city_encrypted) or "",
            state=self.deps.crypto.decrypt(address.state_encrypted) or "",
            summary=self.deps.crypto.decrypt(address.summary_encrypted) or "",
        )


class CatalogService:
    def __init__(self, deps: AppServices):
        self.deps = deps

    def assert_administrator(self, authorization_header: str | None) -> None:
        user = self._parse_user_from_header(authorization_header)
        if user.role.upper() != UserRole.ADMIN.value.upper():
            raise ApiException(403, "Acesso de administrador é obrigatório.")

    def list_branches(self, city: str | None) -> list[BranchResponse]:
        session = self.deps.session
        query = select(Branch).options(selectinload(Branch.reservation_depths)).order_by(Branch.city.asc(), Branch.name.asc())
        branches = session.scalars(query).all()
        return [
            self.to_branch_response(branch)
            for branch in branches
            if not city or _matches_city(branch.city, city)
        ]

    def get_branch(self, branch_id: str) -> BranchResponse:
        return self.to_branch_response(self._find_branch(branch_id))

    def create_branch(self, request: BranchUpsertRequest) -> BranchResponse:
        session = self.deps.session
        branch = Branch(
            name=request.name.strip(),
            slug=request.slug.strip(),
            city=request.city.strip(),
            neighborhood=request.neighborhood.strip(),
            address_line=request.addressLine.strip(),
            open_hours=request.openHours.strip(),
        )
        branch.reservation_depths = [BranchReservationDepth(depth_level=depth.strip()) for depth in sorted(request.reservationDepths)]
        session.add(branch)
        session.commit()
        session.refresh(branch)
        return self.to_branch_response(branch)

    def update_branch(self, branch_id: str, request: BranchUpdateRequest) -> BranchResponse:
        session = self.deps.session
        branch = self._find_branch(branch_id)

        if request.name is not None:
            branch.name = request.name.strip()
        if request.slug is not None:
            branch.slug = request.slug.strip()
        if request.city is not None:
            branch.city = request.city.strip()
        if request.neighborhood is not None:
            branch.neighborhood = request.neighborhood.strip()
        if request.addressLine is not None:
            branch.address_line = request.addressLine.strip()
        if request.openHours is not None:
            branch.open_hours = request.openHours.strip()
        if request.reservationDepths is not None:
            branch.reservation_depths = [BranchReservationDepth(depth_level=depth.strip()) for depth in request.reservationDepths]

        session.commit()
        session.refresh(branch)
        return self.to_branch_response(branch)

    def delete_branch(self, branch_id: str) -> None:
        session = self.deps.session
        branch = self._find_branch(branch_id)
        session.delete(branch)
        session.commit()

    def list_menu(self, category: str | None, featured: bool | None) -> list[MenuItemResponse]:
        session = self.deps.session
        query = select(MenuItem).order_by(MenuItem.category.asc(), MenuItem.name.asc())
        items = session.scalars(query).all()
        return [
            self.to_menu_item_response(item)
            for item in items
            if (category is None or item.category == category.strip().lower())
            and (featured is None or item.is_featured == featured)
        ]

    def get_menu_item(self, menu_item_id: str) -> MenuItemResponse:
        return self.to_menu_item_response(self._find_menu_item(menu_item_id))

    def create_menu_item(self, request: MenuItemUpsertRequest) -> MenuItemResponse:
        session = self.deps.session
        item = MenuItem(
            name=request.name.strip(),
            slug=request.slug.strip(),
            description=request.description.strip(),
            category=request.category.strip().lower(),
            price_cents=request.priceCents,
            is_featured=bool(request.isFeatured),
            image_hint=_normalize_optional(request.imageHint),
            image_url=_normalize_optional(request.imageUrl),
            available_for_delivery=True if request.availableForDelivery is None else request.availableForDelivery,
            available_for_dine_in=True if request.availableForDineIn is None else request.availableForDineIn,
            accent_color=(request.accentColor or "#31e7ff").strip(),
        )
        session.add(item)
        session.commit()
        session.refresh(item)
        return self.to_menu_item_response(item)

    def update_menu_item(self, menu_item_id: str, request: MenuItemUpdateRequest) -> MenuItemResponse:
        session = self.deps.session
        item = self._find_menu_item(menu_item_id)
        if request.name is not None:
            item.name = request.name.strip()
        if request.slug is not None:
            item.slug = request.slug.strip()
        if request.description is not None:
            item.description = request.description.strip()
        if request.category is not None:
            item.category = request.category.strip().lower()
        if request.priceCents is not None:
            item.price_cents = request.priceCents
        if request.isFeatured is not None:
            item.is_featured = request.isFeatured
        if request.imageHint is not None:
            item.image_hint = _normalize_optional(request.imageHint)
        if request.imageUrl is not None:
            item.image_url = _normalize_optional(request.imageUrl)
        if request.availableForDelivery is not None:
            item.available_for_delivery = request.availableForDelivery
        if request.availableForDineIn is not None:
            item.available_for_dine_in = request.availableForDineIn
        if request.accentColor is not None:
            item.accent_color = request.accentColor.strip()
        session.commit()
        session.refresh(item)
        return self.to_menu_item_response(item)

    def delete_menu_item(self, menu_item_id: str) -> None:
        session = self.deps.session
        item = self._find_menu_item(menu_item_id)
        session.delete(item)
        session.commit()

    def get_branch_snapshot(self, branch_id: str) -> InternalBranchResponse:
        branch = self._find_branch(branch_id)
        return InternalBranchResponse(
            id=branch.id,
            name=branch.name,
            reservationDepths=sorted(depth.depth_level for depth in branch.reservation_depths),
        )

    def lookup_menu_items(self, ids: Iterable[str]) -> list[InternalMenuItemResponse]:
        session = self.deps.session
        unique_ids = list(dict.fromkeys(ids))
        items = session.scalars(select(MenuItem).where(MenuItem.id.in_(unique_ids))).all()
        found = {item.id: item for item in items}

        if len(found) != len(unique_ids):
            raise ApiException(400, "Um ou mais itens do menu são inválidos.")

        return [
            InternalMenuItemResponse(
                id=item.id,
                name=item.name,
                priceCents=item.price_cents,
                availableForDelivery=item.available_for_delivery,
                availableForDineIn=item.available_for_dine_in,
            )
            for item in (found[item_id] for item_id in unique_ids)
        ]

    def _parse_user_from_header(self, authorization_header: str | None) -> User:
        authenticated_user = self.authenticate_header(authorization_header)
        return self._find_user(authenticated_user.id)

    def _find_user(self, user_id: str) -> User:
        session = self.deps.session
        user = session.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise ApiException(401, "Token de autenticação inválido.")
        return user

    def _find_branch(self, branch_id: str) -> Branch:
        session = self.deps.session
        branch = session.scalar(select(Branch).where(Branch.id == branch_id).options(selectinload(Branch.reservation_depths)))
        if branch is None:
            raise ApiException(404, "Filial não encontrada.")
        return branch

    def _find_menu_item(self, menu_item_id: str) -> MenuItem:
        session = self.deps.session
        item = session.scalar(select(MenuItem).where(MenuItem.id == menu_item_id))
        if item is None:
            raise ApiException(404, "Item do menu não encontrado.")
        return item

    @staticmethod
    def to_branch_response(branch: Branch) -> BranchResponse:
        return BranchResponse(
            id=branch.id,
            name=branch.name,
            slug=branch.slug,
            city=branch.city,
            neighborhood=branch.neighborhood,
            addressLine=branch.address_line,
            openHours=branch.open_hours,
            reservationDepths=sorted(depth.depth_level for depth in branch.reservation_depths),
        )

    @staticmethod
    def to_menu_item_response(item: MenuItem) -> MenuItemResponse:
        return MenuItemResponse(
            id=item.id,
            name=item.name,
            slug=item.slug,
            description=item.description,
            category=item.category,
            priceCents=item.price_cents,
            isFeatured=item.is_featured,
            imageHint=item.image_hint,
            imageUrl=item.image_url,
            availableForDelivery=item.available_for_delivery,
            availableForDineIn=item.available_for_dine_in,
            accentColor=item.accent_color,
        )


class OperationsService:
    def __init__(self, deps: AppServices):
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

        order_items = [
            self._to_order_item(item, menu_items, fulfillment_type)
            for item in request.items
        ]
        total_cents = sum(order_item.quantity * order_item.unitPriceCents for order_item in order_items)

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
        for order_item in order_items:
            order.items.append(
                OrderItem(
                    menu_item_id=order_item.menuItemId,
                    name_snapshot=order_item.name,
                    quantity=order_item.quantity,
                    unit_price_cents=order_item.unitPriceCents,
                    note_encrypted=self.deps.crypto.encrypt(_normalize_optional(order_item.note)),
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

    def _to_order_item(self, item, menu_items: dict[str, InternalMenuItemResponse], fulfillment_type: str):
        menu_item = menu_items.get(item.menuItemId)
        if menu_item is None:
            raise ApiException(400, "Um ou mais itens do menu são inválidos.")
        if fulfillment_type == FulfillmentType.DELIVERY.value and not menu_item.availableForDelivery:
            raise ApiException(400, "Um ou mais itens do menu não estão disponíveis para entrega.")
        if fulfillment_type == FulfillmentType.DINE_IN.value and not menu_item.availableForDineIn:
            raise ApiException(400, "Um ou mais itens do menu não estão disponíveis para consumo no local.")
        return item

    @staticmethod
    def _assert_ownership_or_admin(user: AuthenticatedUser, resource_user_id: str, message: str) -> None:
        if user.role.upper() != UserRole.ADMIN.value.upper() and user.id != resource_user_id:
            raise ApiException(403, message)


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _normalize_postal_code(postal_code: str) -> str:
    return "".join(char for char in postal_code if char.isdigit())


def _format_postal_code(postal_code: str) -> str:
    if len(postal_code) != 8:
        return postal_code
    return f"{postal_code[:5]}-{postal_code[5:]}"


def _build_address_summary(request) -> str | None:
    first_line = ", ".join(filter(None, [request.street.strip(), request.number.strip()]))
    second_line = ", ".join(filter(None, [_normalize_optional(request.complement), request.neighborhood.strip()]))
    third_line = f"{request.city.strip()} - {request.state.strip().upper()} • CEP {_format_postal_code(_normalize_postal_code(request.postalCode))}"
    parts = [part for part in [first_line, second_line, third_line] if part]
    return " • ".join(parts) if parts else None


def _matches_city(city: str, filter_value: str) -> bool:
    normalized_filter = filter_value.strip().lower()
    normalized_city = city.lower()
    return normalized_city == normalized_filter or normalized_filter in normalized_city


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
