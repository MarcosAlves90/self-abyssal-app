from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, Field, FutureDatetime, field_validator, model_validator


def _not_blank(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("campo obrigatório.")
    return value


NameStr = Annotated[str, Field(min_length=3, max_length=80)]
SlugStr = Annotated[str, Field(min_length=3, max_length=60)]
ShortText = Annotated[str, Field(min_length=1)]


class RegisterRequest(BaseModel):
    name: Annotated[str, Field(min_length=3, max_length=80)]
    email: Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    password: Annotated[str, Field(min_length=8, max_length=128)]
    phone: Annotated[str, Field(pattern=r"^\d{10,11}$")]

    @field_validator("name", "email", "password", "phone", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value


class LoginRequest(BaseModel):
    email: Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    password: Annotated[str, Field(min_length=8, max_length=128)]

    @field_validator("email", "password", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value


class AddressUpsertRequest(BaseModel):
    label: Annotated[str | None, Field(min_length=2, max_length=40)] = None
    postalCode: Annotated[str, Field(pattern=r"^\d{5}-?\d{3}$")]
    street: Annotated[str, Field(min_length=3, max_length=120)]
    number: Annotated[str, Field(min_length=1, max_length=20)]
    complement: Annotated[str | None, Field(min_length=1, max_length=80)] = None
    neighborhood: Annotated[str, Field(min_length=2, max_length=80)]
    city: Annotated[str, Field(min_length=2, max_length=80)]
    state: Annotated[str, Field(pattern=r"^[a-zA-Z]{2}$")]

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value


class AddressResponse(BaseModel):
    label: str
    postalCode: str
    street: str
    number: str
    complement: str | None = None
    neighborhood: str
    city: str
    state: str
    summary: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    role: str
    savedAddresses: list[AddressResponse] = Field(default_factory=list)


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


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


class ReservationCreateRequest(BaseModel):
    branchId: str
    scheduledAt: FutureDatetime
    guests: Annotated[int, Field(ge=1, le=12)]
    depthLevel: Annotated[str, Field(min_length=3, max_length=40)]
    specialRequest: Annotated[str | None, Field(max_length=200)] = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class ReservationUpdateRequest(BaseModel):
    branchId: str | None = None
    scheduledAt: FutureDatetime | None = None
    guests: Annotated[int, Field(ge=1, le=12)] | None = None
    depthLevel: Annotated[str, Field(min_length=3, max_length=40)] | None = None
    status: Annotated[str, Field(pattern=r"^(confirmed|checked_in|completed|cancelled)$")] | None = None
    specialRequest: Annotated[str | None, Field(max_length=200)] = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def ensure_any_field(self) -> "ReservationUpdateRequest":
        if not any(
            [
                self.branchId,
                self.scheduledAt,
                self.guests is not None,
                self.depthLevel,
                self.status,
                self.specialRequest is not None,
            ]
        ):
            raise ValueError("Pelo menos um campo da reserva deve ser informado.")
        return self


class ReservationResponse(BaseModel):
    id: str
    userId: str
    branchId: str
    branchName: str
    scheduledAt: datetime
    guests: int
    depthLevel: str
    status: str
    specialRequest: str | None = None


class OrderItemRequest(BaseModel):
    menuItemId: str
    quantity: Annotated[int, Field(ge=1, le=20)]
    note: Annotated[str | None, Field(max_length=120)] = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class OrderCreateRequest(BaseModel):
    branchId: str | None = None
    reservationId: str | None = None
    fulfillmentType: Annotated[str, Field(pattern=r"^(delivery|dine_in)$")]
    items: Annotated[list[OrderItemRequest], Field(min_length=1)]
    paymentMethod: Annotated[str, Field(pattern=r"^(in_app_card_tokenized|card_on_delivery|on_site)$")]
    deliveryAddress: Annotated[str | None, Field(min_length=10, max_length=200)] = None
    contactName: Annotated[str | None, Field(min_length=3, max_length=80)] = None

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class OrderUpdateRequest(BaseModel):
    status: Annotated[str | None, Field(pattern=r"^(pending|preparing|on_the_way|served|completed|cancelled)$")] = None
    paymentStatus: Annotated[str | None, Field(pattern=r"^(pending|authorized|paid)$")] = None

    @model_validator(mode="after")
    def ensure_any_field(self) -> "OrderUpdateRequest":
        if self.status is None and self.paymentStatus is None:
            raise ValueError("Pelo menos um campo do pedido deve ser informado.")
        return self


class OrderItemResponse(BaseModel):
    menuItemId: str
    name: str
    quantity: int
    unitPriceCents: int
    note: str | None = None


class OrderResponse(BaseModel):
    id: str
    userId: str
    branchId: str | None = None
    branchName: str | None = None
    reservationId: str | None = None
    fulfillmentType: str
    status: str
    paymentMethod: str
    paymentStatus: str
    totalCents: int
    deliveryAddress: str | None = None
    contactName: str | None = None
    items: list[OrderItemResponse] = Field(default_factory=list)
    createdAt: datetime


class ListResponse(BaseModel):
    branches: list[BranchResponse] | None = None
    items: list[MenuItemResponse] | None = None
    reservations: list[ReservationResponse] | None = None
    orders: list[OrderResponse] | None = None
