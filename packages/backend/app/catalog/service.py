from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..core.errors import ApiException
from ..core.security import UserRole
from ..models import Branch, BranchReservationDepth, MenuItem, User
from .schemas import (
    BranchResponse,
    BranchUpdateRequest,
    BranchUpsertRequest,
    InternalBranchResponse,
    InternalMenuItemResponse,
    MenuItemResponse,
    MenuItemUpsertRequest,
    MenuItemUpdateRequest,
)


class CatalogService:
    def __init__(self, deps):
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
            notes=_normalize_optional(request.notes),
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
        if request.notes is not None:
            item.notes = _normalize_optional(request.notes)
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
        from ..auth.service import AuthService
        auth = AuthService(self.deps)
        authenticated_user = auth.authenticate_header(authorization_header)
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

    def authenticate_header(self, authorization_header: str | None):
        from ..auth.service import AuthService
        return AuthService(self.deps).authenticate_header(authorization_header)

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
            notes=item.notes,
        )


def _matches_city(city: str, filter_value: str) -> bool:
    normalized_filter = filter_value.strip().lower()
    normalized_city = city.lower()
    return normalized_city == normalized_filter or normalized_filter in normalized_city


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None
