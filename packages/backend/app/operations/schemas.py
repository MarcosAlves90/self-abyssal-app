from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, Field, FutureDatetime, field_validator, model_validator


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
