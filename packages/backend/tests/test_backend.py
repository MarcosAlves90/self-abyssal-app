from app.config import normalize_database_url
from app.main import create_app
from app.seed import sample_branches
from app.security import HashingService, JwtService, TextCrypto


def test_normalize_database_url_supports_jdbc_form():
    url = normalize_database_url("jdbc:postgresql://abyssal:secret@postgres:5432/abyssal")

    assert url == "postgresql+psycopg://abyssal:secret@postgres:5432/abyssal"


def test_text_crypto_round_trip():
    crypto = TextCrypto("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
    encrypted = crypto.encrypt("entrada")

    assert encrypted is not None
    assert crypto.decrypt(encrypted) == "entrada"


def test_jwt_round_trip():
    jwt_service = JwtService("dev-only-change-me-please-32-characters-minimum")
    token = jwt_service.generate("user-id", "ADMIN")
    user_id, role = jwt_service.parse(token)

    assert user_id == "user-id"
    assert role == "ADMIN"


def test_app_exposes_core_routes():
    app = create_app()
    paths = {route.path for route in app.routes}

    assert "/health" in paths
    assert "/api/auth/login" in paths
    assert "/api/branches" in paths
    assert "/api/menu" in paths
    assert "/api/orders" in paths
    assert "/api/reservations" in paths


def test_seed_contains_expected_demo_branches():
    branches = sample_branches()

    assert len(branches) >= 3
    assert branches[0].name == "Abyssal Paulista"
