from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ..auth.service import AppServices, AuthService
from ..core.config import get_settings
from ..core.db import get_db
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

router = APIRouter(tags=["operations"])


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


# ── Reservations ─────────────────────────────────────────────────────────────

@router.get("/api/reservations", response_model=dict[str, list[ReservationResponse]])
async def list_reservations(
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
    status: str | None = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservations": operations_service.list_reservations(current_user, status)}


@router.get("/api/reservations/{reservation_id}", response_model=dict[str, ReservationResponse])
async def get_reservation(
    reservation_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservation": operations_service.get_reservation(reservation_id, current_user)}


@router.post("/api/reservations", response_model=dict[str, ReservationResponse], status_code=201)
async def create_reservation(
    request: ReservationCreateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservation": operations_service.create_reservation(request, current_user)}


@router.patch("/api/reservations/{reservation_id}", response_model=dict[str, ReservationResponse])
async def update_reservation(
    reservation_id: str,
    request: ReservationUpdateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"reservation": operations_service.update_reservation(reservation_id, request, current_user)}


@router.delete("/api/reservations/{reservation_id}", status_code=204)
async def delete_reservation(
    reservation_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    operations_service.delete_reservation(reservation_id, current_user)


# ── Orders ───────────────────────────────────────────────────────────────────

@router.get("/api/orders", response_model=dict[str, list[OrderResponse]])
async def list_orders(
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
    status: str | None = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"orders": operations_service.list_orders(current_user, status)}


@router.get("/api/orders/{order_id}", response_model=dict[str, OrderResponse])
async def get_order(
    order_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"order": operations_service.get_order(order_id, current_user)}


@router.post("/api/orders", response_model=dict[str, OrderResponse], status_code=201)
async def create_order(
    request: OrderCreateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"order": operations_service.create_order(request, current_user)}


@router.patch("/api/orders/{order_id}", response_model=dict[str, OrderResponse])
async def update_order(
    order_id: str,
    request: OrderUpdateRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"order": operations_service.update_order(order_id, request, current_user)}


@router.delete("/api/orders/{order_id}", status_code=204)
async def delete_order(
    order_id: str,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    operations_service: Annotated[OperationsService, Depends(_get_operations_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    operations_service.delete_order(order_id, current_user)
