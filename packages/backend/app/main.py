from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .config import get_settings
from .db import ENGINE, SessionLocal, get_db, initialize_database
from .errors import ApiException
from .schemas import (
    AddressUpsertRequest,
    AuthResponse,
    BranchResponse,
    BranchUpdateRequest,
    BranchUpsertRequest,
    InternalBranchResponse,
    InternalMenuItemResponse,
    InternalMenuLookupRequest,
    LoginRequest,
    MenuItemResponse,
    MenuItemUpdateRequest,
    MenuItemUpsertRequest,
    OrderCreateRequest,
    OrderResponse,
    OrderUpdateRequest,
    RegisterRequest,
    ReservationCreateRequest,
    ReservationResponse,
    ReservationUpdateRequest,
    UserResponse,
)
from .seed import seed_database
from .security import AuthenticatedUser, HashingService, JwtService, TextCrypto
from .services import AppServices, AuthService, CatalogService, OperationsService


def build_services(session: Session) -> AppServices:
    settings = get_settings()
    return AppServices(
        session=session,
        jwt=JwtService(settings.app_security_jwt_secret),
        crypto=TextCrypto(settings.app_security_encryption_key),
        hashing=HashingService(),
    )


def get_app_services(session: Session = Depends(get_db)) -> AppServices:
    return build_services(session)


def get_auth_service(services: AppServices = Depends(get_app_services)) -> AuthService:
    return AuthService(services)


def get_catalog_service(services: AppServices = Depends(get_app_services)) -> CatalogService:
    return CatalogService(services)


def get_operations_service(services: AppServices = Depends(get_app_services)) -> OperationsService:
    return OperationsService(services)


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

    register_error_handlers(app)
    register_routes(app)
    return app


def register_error_handlers(app: FastAPI) -> None:
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


def register_routes(app: FastAPI) -> None:
    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "api"}

    @app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
    async def register(request: RegisterRequest, auth_service: AuthService = Depends(get_auth_service)):
        return auth_service.register(request)

    @app.post("/api/auth/login", response_model=AuthResponse)
    async def login(request: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
        return auth_service.login(request)

    @app.get("/api/auth/me", response_model=dict[str, UserResponse])
    async def get_me(
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"user": auth_service.get_current_user(current_user.id)}

    @app.put("/api/auth/me/address", response_model=dict[str, UserResponse])
    async def save_address(
        request: AddressUpsertRequest,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"user": auth_service.save_primary_address(current_user.id, request)}

    @app.get("/api/branches", response_model=dict[str, list[BranchResponse]])
    async def list_branches(city: str | None = None, catalog_service: CatalogService = Depends(get_catalog_service)):
        return {"branches": catalog_service.list_branches(city)}

    @app.get("/api/branches/{branch_id}", response_model=dict[str, BranchResponse])
    async def get_branch(branch_id: str, catalog_service: CatalogService = Depends(get_catalog_service)):
        return {"branch": catalog_service.get_branch(branch_id)}

    @app.post("/api/branches", response_model=dict[str, BranchResponse], status_code=201)
    async def create_branch(
        request: BranchUpsertRequest,
        authorization: str | None = Header(default=None),
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        catalog_service.assert_administrator(authorization)
        return {"branch": catalog_service.create_branch(request)}

    @app.patch("/api/branches/{branch_id}", response_model=dict[str, BranchResponse])
    async def update_branch(
        branch_id: str,
        request: BranchUpdateRequest,
        authorization: str | None = Header(default=None),
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        catalog_service.assert_administrator(authorization)
        return {"branch": catalog_service.update_branch(branch_id, request)}

    @app.delete("/api/branches/{branch_id}", status_code=204)
    async def delete_branch(
        branch_id: str,
        authorization: str | None = Header(default=None),
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        catalog_service.assert_administrator(authorization)
        catalog_service.delete_branch(branch_id)

    @app.get("/api/menu", response_model=dict[str, list[MenuItemResponse]])
    async def list_menu(
        category: str | None = None,
        featured: bool | None = None,
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        return {"items": catalog_service.list_menu(category, featured)}

    @app.get("/api/menu/{menu_item_id}", response_model=dict[str, MenuItemResponse])
    async def get_menu_item(menu_item_id: str, catalog_service: CatalogService = Depends(get_catalog_service)):
        return {"item": catalog_service.get_menu_item(menu_item_id)}

    @app.post("/api/menu", response_model=dict[str, MenuItemResponse], status_code=201)
    async def create_menu_item(
        request: MenuItemUpsertRequest,
        authorization: str | None = Header(default=None),
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        catalog_service.assert_administrator(authorization)
        return {"item": catalog_service.create_menu_item(request)}

    @app.patch("/api/menu/{menu_item_id}", response_model=dict[str, MenuItemResponse])
    async def update_menu_item(
        menu_item_id: str,
        request: MenuItemUpdateRequest,
        authorization: str | None = Header(default=None),
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        catalog_service.assert_administrator(authorization)
        return {"item": catalog_service.update_menu_item(menu_item_id, request)}

    @app.delete("/api/menu/{menu_item_id}", status_code=204)
    async def delete_menu_item(
        menu_item_id: str,
        authorization: str | None = Header(default=None),
        catalog_service: CatalogService = Depends(get_catalog_service),
    ):
        catalog_service.assert_administrator(authorization)
        catalog_service.delete_menu_item(menu_item_id)

    @app.get("/api/reservations", response_model=dict[str, list[ReservationResponse]])
    async def list_reservations(
        authorization: str | None = Header(default=None),
        status: str | None = None,
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"reservations": operations_service.list_reservations(current_user, status)}

    @app.get("/api/reservations/{reservation_id}", response_model=dict[str, ReservationResponse])
    async def get_reservation(
        reservation_id: str,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"reservation": operations_service.get_reservation(reservation_id, current_user)}

    @app.post("/api/reservations", response_model=dict[str, ReservationResponse], status_code=201)
    async def create_reservation(
        request: ReservationCreateRequest,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"reservation": operations_service.create_reservation(request, current_user)}

    @app.patch("/api/reservations/{reservation_id}", response_model=dict[str, ReservationResponse])
    async def update_reservation(
        reservation_id: str,
        request: ReservationUpdateRequest,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"reservation": operations_service.update_reservation(reservation_id, request, current_user)}

    @app.delete("/api/reservations/{reservation_id}", status_code=204)
    async def delete_reservation(
        reservation_id: str,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        operations_service.delete_reservation(reservation_id, current_user)

    @app.get("/api/orders", response_model=dict[str, list[OrderResponse]])
    async def list_orders(
        authorization: str | None = Header(default=None),
        status: str | None = None,
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"orders": operations_service.list_orders(current_user, status)}

    @app.get("/api/orders/{order_id}", response_model=dict[str, OrderResponse])
    async def get_order(
        order_id: str,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"order": operations_service.get_order(order_id, current_user)}

    @app.post("/api/orders", response_model=dict[str, OrderResponse], status_code=201)
    async def create_order(
        request: OrderCreateRequest,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"order": operations_service.create_order(request, current_user)}

    @app.patch("/api/orders/{order_id}", response_model=dict[str, OrderResponse])
    async def update_order(
        order_id: str,
        request: OrderUpdateRequest,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        return {"order": operations_service.update_order(order_id, request, current_user)}

    @app.delete("/api/orders/{order_id}", status_code=204)
    async def delete_order(
        order_id: str,
        authorization: str | None = Header(default=None),
        auth_service: AuthService = Depends(get_auth_service),
        operations_service: OperationsService = Depends(get_operations_service),
    ):
        current_user = auth_service.authenticate_header(authorization)
        operations_service.delete_order(order_id, current_user)


app = create_app()
