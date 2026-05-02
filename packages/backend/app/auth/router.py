from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header

from ..auth.service import AppServices, AuthService
from ..core.db import get_db
from ..core.security import HashingService, JwtService, TextCrypto
from ..core.config import get_settings
from .schemas import AddressUpsertRequest, AuthResponse, LoginRequest, RegisterRequest, UserResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["auth"])


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


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    request: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
):
    return auth_service.register(request)


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
):
    return auth_service.login(request)


@router.get("/me", response_model=dict[str, UserResponse])
async def get_me(
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"user": auth_service.get_current_user(current_user.id)}


@router.put("/me/address", response_model=dict[str, UserResponse])
async def save_address(
    request: AddressUpsertRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"user": auth_service.save_primary_address(current_user.id, request)}
