from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import StrEnum
from secrets import token_bytes

import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from passlib.context import CryptContext

from .errors import ApiException


class UserRole(StrEnum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class JwtService:
    def __init__(self, secret: str):
        if not secret or len(secret) < 32:
            raise RuntimeError("APP_SECURITY_JWT_SECRET deve conter pelo menos 32 caracteres.")

        self._secret = secret

    def generate(self, user_id: str, role: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "role": role,
            "iat": now,
            "exp": now + timedelta(days=7),
        }
        return jwt.encode(payload, self._secret, algorithm="HS256")

    def parse(self, token: str) -> tuple[str, str]:
        try:
            claims = jwt.decode(token, self._secret, algorithms=["HS256"])
            return str(claims["sub"]), str(claims["role"])
        except Exception as exc:  # noqa: BLE001
            raise ApiException(401, "Token de autenticação inválido.") from exc


class HashingService:
    def sha256(self, value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()


class TextCrypto:
    _AES = "AES"
    _IV_LENGTH = 12

    def __init__(self, hex_key: str):
        if not re.fullmatch(r"[0-9a-fA-F]{64}", hex_key or ""):
            raise RuntimeError("APP_SECURITY_ENCRYPTION_KEY deve conter exatamente 64 caracteres hexadecimais.")

        self._key = bytes.fromhex(hex_key)
        self._aesgcm = AESGCM(self._key)

    def encrypt(self, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None

        iv = token_bytes(self._IV_LENGTH)
        encrypted = self._aesgcm.encrypt(iv, value.encode("utf-8"), None)
        return f"{iv.hex()}:{encrypted.hex()}"

    def decrypt(self, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None

        iv_hex, encrypted_hex = value.split(":", 1)
        return self._aesgcm.decrypt(bytes.fromhex(iv_hex), bytes.fromhex(encrypted_hex), None).decode("utf-8")


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


@dataclass(slots=True)
class AuthenticatedUser:
    id: str
    role: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)
