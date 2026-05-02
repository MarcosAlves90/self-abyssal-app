from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from ..core.errors import ApiException
from ..core.security import AuthenticatedUser, HashingService, JwtService, TextCrypto, hash_password, verify_password
from ..models import User, UserAddress, UserRole
from .schemas import AddressResponse, AddressUpsertRequest, AuthResponse, UserResponse


@dataclass(slots=True)
class AppServices:
    session: Session
    jwt: JwtService
    crypto: TextCrypto
    hashing: HashingService


class AuthService:
    def __init__(self, deps: AppServices):
        self.deps = deps

    def register(self, request) -> AuthResponse:
        session = self.deps.session
        normalized_email = request.email.strip().lower()
        email_hash = self.deps.hashing.sha256(normalized_email)

        if session.scalar(select(User).where(User.email_hash == email_hash)) is not None:
            raise ApiException(409, "Já existe uma conta com este e-mail.")

        user = User(
            name=request.name.strip(),
            email_hash=email_hash,
            email_encrypted=self.deps.crypto.encrypt(normalized_email),
            password_hash=hash_password(request.password),
            phone_encrypted=self.deps.crypto.encrypt(request.phone.strip()),
            role=UserRole.CUSTOMER.value,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return AuthResponse(token=self.deps.jwt.generate(user.id, user.role.upper()), user=self.to_user_response(user))

    def login(self, request) -> AuthResponse:
        session = self.deps.session
        normalized_email = request.email.strip().lower()
        email_hash = self.deps.hashing.sha256(normalized_email)
        user = session.scalar(select(User).where(User.email_hash == email_hash))

        if user is None or not verify_password(request.password, user.password_hash):
            raise ApiException(401, "E-mail ou senha inválidos.")

        return AuthResponse(token=self.deps.jwt.generate(user.id, user.role.upper()), user=self.to_user_response(user))

    def get_current_user(self, user_id: str) -> UserResponse:
        user = self._find_user(user_id)
        return self.to_user_response(user)

    def save_primary_address(self, user_id: str, request: AddressUpsertRequest) -> UserResponse:
        user = self._find_user(user_id)
        session = self.deps.session

        session.execute(delete(UserAddress).where(UserAddress.user_id == user.id))
        address = UserAddress(
            user_id=user.id,
            label=(request.label or "Principal").strip(),
            postal_code_encrypted=self.deps.crypto.encrypt(_normalize_postal_code(request.postalCode)),
            street_encrypted=self.deps.crypto.encrypt(request.street.strip()),
            number_encrypted=self.deps.crypto.encrypt(request.number.strip()),
            complement_encrypted=self.deps.crypto.encrypt(_normalize_optional(request.complement)),
            neighborhood_encrypted=self.deps.crypto.encrypt(request.neighborhood.strip()),
            city_encrypted=self.deps.crypto.encrypt(request.city.strip()),
            state_encrypted=self.deps.crypto.encrypt(request.state.strip().upper()),
            summary_encrypted=self.deps.crypto.encrypt(_build_address_summary(request)),
            is_primary=True,
        )
        session.add(address)
        session.commit()
        return self.get_current_user(user.id)

    def authenticate_header(self, authorization_header: str | None) -> AuthenticatedUser:
        if not authorization_header or not authorization_header.startswith("Bearer "):
            raise ApiException(401, "Token de autenticação é obrigatório.")

        token = authorization_header.removeprefix("Bearer ").strip()
        user_id, role = self.deps.jwt.parse(token)
        user = self._find_user(user_id)
        if user.role.upper() != role.upper():
            raise ApiException(401, "Token de autenticação inválido.")
        return AuthenticatedUser(id=user.id, role=user.role)

    def _find_user(self, user_id: str) -> User:
        session = self.deps.session
        user = session.scalar(select(User).where(User.id == user_id).options(selectinload(User.addresses)))
        if user is None:
            raise ApiException(404, "Usuário autenticado não encontrado.")
        return user

    def to_user_response(self, user: User) -> UserResponse:
        addresses = sorted(user.addresses, key=lambda address: not address.is_primary)
        return UserResponse(
            id=user.id,
            name=user.name,
            email=self.deps.crypto.decrypt(user.email_encrypted) or "",
            role=user.role,
            savedAddresses=[self.to_address_response(address) for address in addresses],
        )

    def to_address_response(self, address: UserAddress) -> AddressResponse:
        return AddressResponse(
            label=address.label,
            postalCode=_format_postal_code(self.deps.crypto.decrypt(address.postal_code_encrypted) or ""),
            street=self.deps.crypto.decrypt(address.street_encrypted) or "",
            number=self.deps.crypto.decrypt(address.number_encrypted) or "",
            complement=self.deps.crypto.decrypt(address.complement_encrypted),
            neighborhood=self.deps.crypto.decrypt(address.neighborhood_encrypted) or "",
            city=self.deps.crypto.decrypt(address.city_encrypted) or "",
            state=self.deps.crypto.decrypt(address.state_encrypted) or "",
            summary=self.deps.crypto.decrypt(address.summary_encrypted) or "",
        )


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _normalize_postal_code(postal_code: str) -> str:
    return "".join(char for char in postal_code if char.isdigit())


def _format_postal_code(postal_code: str) -> str:
    if len(postal_code) != 8:
        return postal_code
    return f"{postal_code[:5]}-{postal_code[5:]}"


def _build_address_summary(request) -> str | None:
    first_line = ", ".join(filter(None, [request.street.strip(), request.number.strip()]))
    second_line = ", ".join(filter(None, [_normalize_optional(request.complement), request.neighborhood.strip()]))
    third_line = f"{request.city.strip()} - {request.state.strip().upper()} • CEP {_format_postal_code(_normalize_postal_code(request.postalCode))}"
    parts = [part for part in [first_line, second_line, third_line] if part]
    return " • ".join(parts) if parts else None
