from pytest import raises
from pydantic import ValidationError

from app.auth.schemas import (
    AddressResponse,
    AddressUpsertRequest,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)


def test_login_request_accepts_untrusted_credentials_without_field_level_validation():
    request = LoginRequest(email=" usuario ", password=" 123 ")  # NOSONAR

    assert request.email == "usuario"
    assert request.password == "123"


def test_login_request_accepts_non_email_input_for_generic_auth_failure():
    request = LoginRequest(email="nao-e-mail", password="qualquer-coisa")  # NOSONAR

    assert request.email == "nao-e-mail"
    assert request.password == "qualquer-coisa"


def test_register_request_trims_and_validates_fields():
    request = RegisterRequest(
        name="  Ana Clara  ",
        email=" ANA@MAIL.COM ",
        password="12345678",  # NOSONAR
        phone=" 11999998888 ",
    )

    assert request.name == "Ana Clara"
    assert request.email == "ANA@MAIL.COM"
    assert request.password == "12345678"
    assert request.phone == "11999998888"


def test_register_request_rejects_invalid_email():
    with raises(ValidationError):
        RegisterRequest(
            name="Ana Clara",
            email="nao-e-mail",
            password="12345678",  # NOSONAR
            phone="11999998888",
        )


def test_address_upsert_request_trims_and_validates_fields():
    request = AddressUpsertRequest(
        label="  Casa  ",
        postalCode=" 12345-678 ",
        street=" Rua A ",
        number=" 12 ",
        complement=" Apto 2 ",
        neighborhood=" Centro ",
        city=" Sao Paulo ",
        state=" sp ",
    )

    assert request.label == "Casa"
    assert request.postalCode == "12345-678"
    assert request.street == "Rua A"
    assert request.number == "12"
    assert request.complement == "Apto 2"
    assert request.neighborhood == "Centro"
    assert request.city == "Sao Paulo"
    assert request.state == "sp"


def test_address_upsert_request_rejects_invalid_postal_code():
    with raises(ValidationError):
        AddressUpsertRequest(
            label="Casa",
            postalCode="123",
            street="Rua A",
            number="12",
            complement=None,
            neighborhood="Centro",
            city="Sao Paulo",
            state="SP",
        )


def test_response_models_keep_expected_shape():
    user = UserResponse(
        id="u1",
        name="Marcos",
        email="marcos@mail.com",
        role="customer",
    )
    response = AuthResponse(token="jwt-token", user=user)

    assert response.token == "jwt-token"
    assert response.user.savedAddresses == []

    address = AddressResponse(
        label="Principal",
        postalCode="12345-678",
        street="Rua A",
        number="12",
        complement=None,
        neighborhood="Centro",
        city="Sao Paulo",
        state="SP",
        summary="Rua A, 12",
    )

    assert address.summary == "Rua A, 12"
