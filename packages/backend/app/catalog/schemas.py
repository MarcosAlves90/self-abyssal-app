from __future__ import annotations

from typing import Annotated, Any

from pydantic import BaseModel, Field, field_validator, model_validator

NameStr = Annotated[str, Field(min_length=3, max_length=80)]
SlugStr = Annotated[str, Field(min_length=3, max_length=60)]


class BranchUpsertRequest(BaseModel):
    name: NameStr
    slug: SlugStr
    city: Annotated[str, Field(min_length=2, max_length=80)]
    neighborhood: Annotated[str, Field(min_length=2, max_length=80)]
    addressLine: Annotated[str, Field(min_length=5, max_length=120)]
    openHours: Annotated[str, Field(min_length=5, max_length=80)]
    reservationDepths: Annotated[list[Annotated[str, Field(min_length=2, max_length=40)]], Field(min_length=1)]

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class BranchUpdateRequest(BaseModel):
    name: NameStr | None = None
    slug: SlugStr | None = None
    city: Annotated[str, Field(min_length=2, max_length=80)] | None = None
    neighborhood: Annotated[str, Field(min_length=2, max_length=80)] | None = None
    addressLine: Annotated[str, Field(min_length=5, max_length=120)] | None = None
    openHours: Annotated[str, Field(min_length=5, max_length=80)] | None = None
    reservationDepths: list[Annotated[str, Field(min_length=2, max_length=40)]] | None = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def ensure_any_field(self) -> "BranchUpdateRequest":
        if not any(
            [
                self.name,
                self.slug,
                self.city,
                self.neighborhood,
                self.addressLine,
                self.openHours,
                self.reservationDepths is not None,
            ]
        ):
            raise ValueError("Pelo menos um campo da filial deve ser informado.")
        return self


class BranchResponse(BaseModel):
    id: str
    name: str
    slug: str
    city: str
    neighborhood: str
    addressLine: str
    openHours: str
    reservationDepths: list[str]


class InternalBranchResponse(BaseModel):
    id: str
    name: str
    reservationDepths: list[str]


class MenuItemUpsertRequest(BaseModel):
    name: NameStr
    slug: Annotated[str, Field(min_length=3, max_length=60)]
    description: Annotated[str, Field(min_length=10, max_length=300)]
    category: Annotated[str, Field(pattern=r"^(entradas|principais|sobremesas|bebidas)$")]
    priceCents: Annotated[int, Field(ge=1, le=1000000)]
    isFeatured: bool | None = None
    imageHint: Annotated[str | None, Field(max_length=80)] = None
    imageUrl: Annotated[str | None, Field(max_length=300)] = None
    availableForDelivery: bool | None = None
    availableForDineIn: bool | None = None
    accentColor: Annotated[str | None, Field(max_length=20)] = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class MenuItemUpdateRequest(BaseModel):
    name: NameStr | None = None
    slug: Annotated[str, Field(min_length=3, max_length=60)] | None = None
    description: Annotated[str, Field(min_length=10, max_length=300)] | None = None
    category: Annotated[str, Field(pattern=r"^(entradas|principais|sobremesas|bebidas)$")] | None = None
    priceCents: Annotated[int, Field(ge=1, le=1000000)] | None = None
    isFeatured: bool | None = None
    imageHint: Annotated[str | None, Field(max_length=80)] = None
    imageUrl: Annotated[str | None, Field(max_length=300)] = None
    availableForDelivery: bool | None = None
    availableForDineIn: bool | None = None
    accentColor: Annotated[str | None, Field(max_length=20)] = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def ensure_any_field(self) -> "MenuItemUpdateRequest":
        if not any(
            [
                self.name,
                self.slug,
                self.description,
                self.category,
                self.priceCents is not None,
                self.isFeatured is not None,
                self.imageHint is not None,
                self.imageUrl is not None,
                self.availableForDelivery is not None,
                self.availableForDineIn is not None,
                self.accentColor is not None,
            ]
        ):
            raise ValueError("Pelo menos um campo do item deve ser informado.")
        return self


class MenuItemResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    category: str
    priceCents: int
    isFeatured: bool
    imageHint: str | None = None
    imageUrl: str | None = None
    availableForDelivery: bool
    availableForDineIn: bool
    accentColor: str


class InternalMenuItemResponse(BaseModel):
    id: str
    name: str
    priceCents: int
    availableForDelivery: bool
    availableForDineIn: bool


class InternalMenuLookupRequest(BaseModel):
    ids: Annotated[list[str], Field(min_length=1)]
