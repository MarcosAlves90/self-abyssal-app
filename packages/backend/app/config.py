from functools import lru_cache
from urllib.parse import urlparse

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(default="postgresql+psycopg://abyssal:abyssal@localhost:5432/abyssal", alias="DATABASE_URL")

    app_security_jwt_secret: str = Field(default="dev-only-change-me-please-32-characters-minimum")
    app_security_encryption_key: str = Field(
        default="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    )
    app_security_require_https_in_production: bool = Field(default=False)

    app_seed_enabled: bool = Field(default=True)
    app_seed_admin_name: str = Field(default="Abyssal Admin")
    app_seed_admin_email: str = Field(default="admin@abyssal.local")
    app_seed_admin_password: str = Field(default="Admin123!")

    app_catalog_base_url: str | None = Field(default=None)
    cors_allowed_origins: str = Field(default="http://localhost:19006,http://127.0.0.1:19006")
    cors_allow_localhost: bool = Field(default=True)

    @property
    def sqlalchemy_database_url(self) -> str:
        return normalize_database_url(self.database_url)

    @property
    def allowed_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def allowed_cors_origin_regex(self) -> str | None:
        if not self.cors_allow_localhost:
            return None
        return r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def normalize_database_url(raw_url: str) -> str:
    if raw_url.startswith("jdbc:postgresql://"):
        parsed = urlparse(raw_url.removeprefix("jdbc:"))
        auth = f"{parsed.username}:{parsed.password}@" if parsed.username and parsed.password else ""
        return f"postgresql+psycopg://{auth}{parsed.hostname or 'localhost'}{f':{parsed.port}' if parsed.port else ''}{parsed.path}"

    if raw_url.startswith("postgresql://") or raw_url.startswith("postgresql+psycopg://"):
        return raw_url

    return raw_url
