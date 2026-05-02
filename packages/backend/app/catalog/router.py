from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ..auth.service import AppServices
from ..core.config import get_settings
from ..core.db import get_db
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

router = APIRouter(tags=["catalog"])


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


# ── Branches ────────────────────────────────────────────────────────────────

@router.get("/api/branches", response_model=dict[str, list[BranchResponse]])
async def list_branches(
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    city: str | None = None,
):
    return {"branches": catalog_service.list_branches(city)}


@router.get("/api/branches/{branch_id}", response_model=dict[str, BranchResponse])
async def get_branch(
    branch_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
):
    return {"branch": catalog_service.get_branch(branch_id)}


@router.post("/api/branches", response_model=dict[str, BranchResponse], status_code=201)
async def create_branch(
    request: BranchUpsertRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    catalog_service.assert_administrator(authorization)
    return {"branch": catalog_service.create_branch(request)}


@router.patch("/api/branches/{branch_id}", response_model=dict[str, BranchResponse])
async def update_branch(
    branch_id: str,
    request: BranchUpdateRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    catalog_service.assert_administrator(authorization)
    return {"branch": catalog_service.update_branch(branch_id, request)}


@router.delete("/api/branches/{branch_id}", status_code=204)
async def delete_branch(
    branch_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    catalog_service.assert_administrator(authorization)
    catalog_service.delete_branch(branch_id)


# ── Menu ─────────────────────────────────────────────────────────────────────

@router.get("/api/menu", response_model=dict[str, list[MenuItemResponse]])
async def list_menu(
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    category: str | None = None,
    featured: bool | None = None,
):
    return {"items": catalog_service.list_menu(category, featured)}


@router.get("/api/menu/{menu_item_id}", response_model=dict[str, MenuItemResponse])
async def get_menu_item(
    menu_item_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
):
    return {"item": catalog_service.get_menu_item(menu_item_id)}


@router.post("/api/menu", response_model=dict[str, MenuItemResponse], status_code=201)
async def create_menu_item(
    request: MenuItemUpsertRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    catalog_service.assert_administrator(authorization)
    return {"item": catalog_service.create_menu_item(request)}


@router.patch("/api/menu/{menu_item_id}", response_model=dict[str, MenuItemResponse])
async def update_menu_item(
    menu_item_id: str,
    request: MenuItemUpdateRequest,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    catalog_service.assert_administrator(authorization)
    return {"item": catalog_service.update_menu_item(menu_item_id, request)}


@router.delete("/api/menu/{menu_item_id}", status_code=204)
async def delete_menu_item(
    menu_item_id: str,
    catalog_service: Annotated[CatalogService, Depends(_get_catalog_service)],
    authorization: Annotated[str | None, Header()] = None,
):
    catalog_service.assert_administrator(authorization)
    catalog_service.delete_menu_item(menu_item_id)
