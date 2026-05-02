from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth.service import AppServices, AuthService
from ..core.config import get_settings
from ..core.db import get_db
from ..core.deps import get_authorization
from ..core.security import HashingService, JwtService, TextCrypto
from .schemas import (
    OrderCreateRequest,
    OrderResponse,
    OrderUpdateRequest,
    ReservationCreateRequest,
    ReservationResponse,
    ReservationUpdateRequest,
)
from .service import OperationsService

router = APIRouter(tags=["Operations"])


def _build_services(session: Annotated[Session, Depends(get_db)]) -> AppServices:
    settings = get_settings()
    return AppServices(
        session=session,
        jwt=JwtService(settings.app_security_jwt_secret),
        crypto=TextCrypto(settings.app_security_encryption_key),
        hashing=HashingService(),
    )


def _get_auth_service(services: Annotated[AppServices, Depends(_build_services)]) -> AuthService:
    return AuthService(services)


def _get_operations_service(services: Annotated[AppServices, Depends(_build_services)]) -> OperationsService:
    return OperationsService(services)


AuthorizationDep = Annotated[str | None, Depends(get_authorization)]


# ── Reservations ──────────────────────────────────────────────────────────────

@router.get(
    "/api/reservations",
    response_model=dict[str, list[ReservationResponse]],
    summary="Listar reservas",
    description=(
        "Retorna as reservas do usuário autenticado, ordenadas por data de agendamento. "
        "Administradores visualizam todas as reservas de todos os usuários. "
        "Filtre por `status` (confirmed, checked_in, completed, cancelled). "
        "Requer autenticação."
    ),
)
async def list_reservations(
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
    status: str | None = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservations": operations_service.list_reservations(current_user, status)}


@router.get(
    "/api/reservations/{reservation_id}",
    response_model=dict[str, ReservationResponse],
    summary="Obter reserva por ID",
    description=(
        "Retorna os detalhes de uma reserva específica. "
        "O usuário só pode acessar suas próprias reservas; administradores acessam qualquer uma. "
        "Retorna 403 se não houver permissão, 404 se não encontrada."
    ),
)
async def get_reservation(
    reservation_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservation": operations_service.get_reservation(reservation_id, current_user)}


@router.post(
    "/api/reservations",
    response_model=dict[str, ReservationResponse],
    status_code=201,
    summary="Criar reserva",
    description=(
        "Cria uma nova reserva para o usuário autenticado em uma filial e nível de profundidade específicos. "
        "O nível (`depthLevel`) deve ser um dos disponíveis na filial escolhida. "
        "Retorna 409 se o horário e nível já estiverem ocupados. Requer autenticação."
    ),
)
async def create_reservation(
    request: ReservationCreateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservation": operations_service.create_reservation(request, current_user)}


@router.patch(
    "/api/reservations/{reservation_id}",
    response_model=dict[str, ReservationResponse],
    summary="Atualizar reserva",
    description=(
        "Atualiza parcialmente uma reserva existente. "
        "Clientes só podem alterar para o status `cancelled`; demais status exigem administrador. "
        "Retorna 409 se o novo horário/nível estiver indisponível."
    ),
)
async def update_reservation(
    reservation_id: str,
    request: ReservationUpdateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservation": operations_service.update_reservation(reservation_id, request, current_user)}


@router.delete(
    "/api/reservations/{reservation_id}",
    status_code=204,
    summary="Excluir reserva",
    description=(
        "Remove permanentemente uma reserva. "
        "O usuário só pode excluir suas próprias reservas; administradores podem excluir qualquer uma."
    ),
)
async def delete_reservation(
    reservation_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    operations_service.delete_reservation(reservation_id, current_user)


# ── Orders ────────────────────────────────────────────────────────────────────

@router.get(
    "/api/orders",
    response_model=dict[str, list[OrderResponse]],
    summary="Listar pedidos",
    description=(
        "Retorna os pedidos do usuário autenticado, ordenados do mais recente ao mais antigo. "
        "Administradores visualizam todos os pedidos. "
        "Filtre por `status` (pending, preparing, on_the_way, served, completed, cancelled). "
        "Requer autenticação."
    ),
)
async def list_orders(
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
    status: str | None = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"orders": operations_service.list_orders(current_user, status)}


@router.get(
    "/api/orders/{order_id}",
    response_model=dict[str, OrderResponse],
    summary="Obter pedido por ID",
    description=(
        "Retorna os detalhes completos de um pedido, incluindo seus itens. "
        "O usuário só pode acessar seus próprios pedidos; administradores acessam qualquer um."
    ),
)
async def get_order(
    order_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"order": operations_service.get_order(order_id, current_user)}


@router.post(
    "/api/orders",
    response_model=dict[str, OrderResponse],
    status_code=201,
    summary="Criar pedido",
    description=(
        "Cria um novo pedido com um ou mais itens do cardápio. "
        "Para `delivery`, o campo `deliveryAddress` é obrigatório. "
        "Para `dine_in`, `branchId` é obrigatório (pode ser inferido de uma reserva vinculada). "
        "Ao vincular uma reserva (`reservationId`), a filial é herdada automaticamente se não informada. "
        "Requer autenticação."
    ),
)
async def create_order(
    request: OrderCreateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"order": operations_service.create_order(request, current_user)}


@router.patch(
    "/api/orders/{order_id}",
    response_model=dict[str, OrderResponse],
    summary="Atualizar status do pedido",
    description=(
        "Atualiza o status e/ou status de pagamento de um pedido. "
        "Clientes só podem alterar para `cancelled`; demais status exigem administrador. "
        "Apenas administradores podem atualizar `paymentStatus`."
    ),
)
async def update_order(
    order_id: str,
    request: OrderUpdateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"order": operations_service.update_order(order_id, request, current_user)}


@router.delete(
    "/api/orders/{order_id}",
    status_code=204,
    summary="Excluir pedido",
    description=(
        "Remove permanentemente um pedido e todos os seus itens (cascade). "
        "O usuário só pode excluir seus próprios pedidos; administradores podem excluir qualquer um."
    ),
)
async def delete_order(
    order_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    operations_service.delete_order(order_id, current_user)
