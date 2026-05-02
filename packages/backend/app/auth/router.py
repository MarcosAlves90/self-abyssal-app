from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ..auth.service import AppServices, AuthService
from ..core.config import get_settings
from ..core.db import get_db
from ..core.deps import get_authorization
from ..core.security import HashingService, JwtService, TextCrypto
from .schemas import AddressUpsertRequest, AuthResponse, LoginRequest, RegisterRequest, UserResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["Auth"])


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


AuthorizationDep = Annotated[str | None, Depends(get_authorization)]


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    summary="Criar conta de usuário",
    description=(
        "Registra um novo usuário com nome, e-mail, senha e telefone. "
        "Retorna o token JWT e os dados do usuário recém-criado. "
        "Retorna 409 se já existir uma conta com o mesmo e-mail."
    ),
)
async def register(
    request: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
):
    return auth_service.register(request)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Autenticar usuário",
    description=(
        "Autentica com e-mail e senha. "
        "Retorna um token JWT válido por 7 dias e os dados do usuário. "
        "Retorna 401 se as credenciais forem inválidas."
    ),
)
async def login(
    request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
):
    return auth_service.login(request)


@router.get(
    "/me",
    response_model=dict[str, UserResponse],
    summary="Obter perfil do usuário autenticado",
    description=(
        "Retorna os dados completos do usuário autenticado, incluindo endereços salvos. "
        "Requer token Bearer válido no header Authorization."
    ),
)
async def get_me(
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"user": auth_service.get_current_user(current_user.id)}


@router.put(
    "/me/address",
    response_model=dict[str, UserResponse],
    summary="Salvar endereço principal",
    description=(
        "Substitui o endereço principal do usuário autenticado. "
        "O endereço anterior é removido e um novo é criado com os dados fornecidos. "
        "Requer token Bearer válido no header Authorization."
    ),
)
async def save_address(
    request: AddressUpsertRequest,
    auth_service: Annotated[AuthService, Depends(_get_auth_service)],
    authorization: AuthorizationDep,
):
    current_user = auth_service.authenticate_header(authorization)
    return {"user": auth_service.save_primary_address(current_user.id, request)}
