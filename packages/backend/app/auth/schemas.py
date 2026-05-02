from __future__ import annotations

from typing import Annotated, Any

from pydantic import BaseModel, Field, field_validator


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
    email: Annotated[str, Field()]
    password: Annotated[str, Field()]

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
