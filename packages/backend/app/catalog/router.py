from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth.service import AppServices
from ..core.config import get_settings
from ..core.db import get_db
from ..core.deps import get_authorization
from ..core.security import HashingService, JwtService, TextCrypto
from .schemas import (
    BranchResponse,
    BranchUpdateRequest,
    BranchUpsertRequest,
    MenuItemResponse,
    MenuItemUpdateRequest,
    MenuItemUpsertRequest,
)
from .service import CatalogService

router = APIRouter(tags=["Catalog"])


def _build_services(session: Annotated[Session, Depends(get_db)]) -> AppServices:
    settings = get_settings()
    return AppServices(
        session=session,
        jwt=JwtService(settings.app_security_jwt_secret),
        crypto=TextCrypto(settings.app_security_encryption_key),
        hashing=HashingService(),
    )


def _get_catalog_service(services: Annotated[AppServices, Depends(_build_services)]) -> CatalogService:
    return CatalogService(services)


AuthorizationDep = Annotated[str | None, Depends(get_authorization)]


# ── Branches ──────────────────────────────────────────────────────────────────

@router.get(
    "/api/branches",
    response_model=dict[str, list[BranchResponse]],
    summary="Listar filiais",
    description=(
        "Retorna todas as filiais cadastradas, ordenadas por cidade e nome. "
        "O parâmetro `city` filtra por nome de cidade (busca parcial, case-insensitive). "
        "Cada filial inclui seus níveis de profundidade disponíveis para reserva."
    ),
)
async def list_branches(
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    city: str | None = None,
):
    return {"branches": catalog_service.list_branches(city)}


@router.get(
    "/api/branches/{branch_id}",
    response_model=dict[str, BranchResponse],
    summary="Obter filial por ID",
    description="Retorna os detalhes completos de uma filial específica, incluindo seus níveis de reserva. Retorna 404 se não encontrada.",
)
async def get_branch(
    branch_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
):
    return {"branch": catalog_service.get_branch(branch_id)}


@router.post(
    "/api/branches",
    response_model=dict[str, BranchResponse],
    status_code=201,
    summary="Criar filial",
    description=(
        "Cria uma nova filial com nome, slug, cidade, endereço, horário e níveis de profundidade. "
        "Requer autenticação de administrador. Retorna 403 se o usuário não for admin."
    ),
)
async def create_branch(
    request: BranchUpsertRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: AuthorizationDep,
):
    catalog_service.assert_administrator(authorization)
    return {"branch": catalog_service.create_branch(request)}


@router.patch(
    "/api/branches/{branch_id}",
    response_model=dict[str, BranchResponse],
    summary="Atualizar filial",
    description=(
        "Atualiza parcialmente os dados de uma filial existente. "
        "Ao atualizar `reservationDepths`, a lista anterior é substituída integralmente. "
        "Requer autenticação de administrador."
    ),
)
async def update_branch(
    branch_id: str,
    request: BranchUpdateRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: AuthorizationDep,
):
    catalog_service.assert_administrator(authorization)
    return {"branch": catalog_service.update_branch(branch_id, request)}


@router.delete(
    "/api/branches/{branch_id}",
    status_code=204,
    summary="Excluir filial",
    description=(
        "Remove permanentemente uma filial e todos os seus níveis de profundidade associados (cascade). "
        "Requer autenticação de administrador."
    ),
)
async def delete_branch(
    branch_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: AuthorizationDep,
):
    catalog_service.assert_administrator(authorization)
    catalog_service.delete_branch(branch_id)


# ── Menu ──────────────────────────────────────────────────────────────────────

@router.get(
    "/api/menu",
    response_model=dict[str, list[MenuItemResponse]],
    summary="Listar itens do cardápio",
    description=(
        "Retorna todos os itens do cardápio, ordenados por categoria e nome. "
        "Filtre por `category` (entradas, principais, sobremesas, bebidas) "
        "e/ou `featured=true` para exibir apenas os destaques."
    ),
)
async def list_menu(
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    category: str | None = None,
    featured: bool | None = None,
):
    return {"items": catalog_service.list_menu(category, featured)}


@router.get(
    "/api/menu/{menu_item_id}",
    response_model=dict[str, MenuItemResponse],
    summary="Obter item do cardápio por ID",
    description="Retorna os detalhes completos de um item específico do cardápio. Retorna 404 se não encontrado.",
)
async def get_menu_item(
    menu_item_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
):
    return {"item": catalog_service.get_menu_item(menu_item_id)}


@router.post(
    "/api/menu",
    response_model=dict[str, MenuItemResponse],
    status_code=201,
    summary="Criar item do cardápio",
    description=(
        "Cria um novo item no cardápio com nome, slug, descrição, categoria, preço e disponibilidade. "
        "Categorias aceitas: `entradas`, `principais`, `sobremesas`, `bebidas`. "
        "Requer autenticação de administrador."
    ),
)
async def create_menu_item(
    request: MenuItemUpsertRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: AuthorizationDep,
):
    catalog_service.assert_administrator(authorization)
    return {"item": catalog_service.create_menu_item(request)}


@router.patch(
    "/api/menu/{menu_item_id}",
    response_model=dict[str, MenuItemResponse],
    summary="Atualizar item do cardápio",
    description=(
        "Atualiza parcialmente um item do cardápio existente. "
        "Apenas os campos enviados no body serão modificados. "
        "Requer autenticação de administrador."
    ),
)
async def update_menu_item(
    menu_item_id: str,
    request: MenuItemUpdateRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: AuthorizationDep,
):
    catalog_service.assert_administrator(authorization)
    return {"item": catalog_service.update_menu_item(menu_item_id, request)}


@router.delete(
    "/api/menu/{menu_item_id}",
    status_code=204,
    summary="Excluir item do cardápio",
    description=(
        "Remove permanentemente um item do cardápio. "
        "Requer autenticação de administrador."
    ),
)
async def delete_menu_item(
    menu_item_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: AuthorizationDep,
):
    catalog_service.assert_administrator(authorization)
    catalog_service.delete_menu_item(menu_item_id)
