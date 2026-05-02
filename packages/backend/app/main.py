from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from .auth.router import router as auth_router
from .catalog.router import router as catalog_router
from .core.config import get_settings
from .core.db import ENGINE, SessionLocal, initialize_database
from .core.errors import ApiException
from .core.security import HashingService, TextCrypto
from .operations.router import router as operations_router
from .seed import seed_database


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        initialize_database(ENGINE)
        session = SessionLocal()
        try:
            seed_database(
                session,
                enabled=settings.app_seed_enabled,
                admin_name=settings.app_seed_admin_name,
                admin_email=settings.app_seed_admin_email,
                admin_password=settings.app_seed_admin_password,
                crypto=TextCrypto(settings.app_security_encryption_key),
                hashing=HashingService(),
            )
        finally:
            session.close()
        yield

    app = FastAPI(
        title="Abyssal API",
        version="3.0.0",
        description=(
            "API REST do restaurante Abyssal. "
            "Gerencie autenticação, catálogo (filiais e cardápio) e operações (reservas e pedidos). "
            "Endpoints protegidos exigem token JWT no header `Authorization: Bearer <token>`."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_cors_origins,
        allow_origin_regex=settings.allowed_cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _register_error_handlers(app)

    app.include_router(auth_router)
    app.include_router(catalog_router)
    app.include_router(operations_router)

    @app.get("/health", summary="Health check", description="Verifica se a API está online e respondendo corretamente.", tags=["Health"])
    async def health():
        return {"status": "ok", "service": "api"}

    _configure_openapi(app)

    return app


def _configure_openapi(app: FastAPI) -> None:
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            routes=app.routes,
        )
        schema.setdefault("components", {})
        schema["components"]["securitySchemes"] = {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
        schema["security"] = [{"BearerAuth": []}]
        app.openapi_schema = schema
        return schema

    app.openapi = custom_openapi  # type: ignore[method-assign]


def _register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiException)
    async def handle_api_exception(_: Request, exc: ApiException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.message, "details": exc.details},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError):
        details: dict[str, str] = {}
        for error in exc.errors():
            path = ".".join(str(part) for part in error.get("loc", []) if part != "body")
            details[path] = error.get("msg", "Campo inválido.")
        return JSONResponse(
            status_code=400,
            content={"message": "Payload da requisição inválido.", "details": details or None},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, __: Exception):
        return JSONResponse(
            status_code=500,
            content={"message": "Erro interno inesperado.", "details": None},
        )


app = create_app()
