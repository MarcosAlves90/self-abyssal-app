import {
  ContractError,
  buildAuthRequest,
  buildOrderRequest,
  normalizeAuthSessionResponse,
  normalizeMenuItemResponse,
  normalizeReservationResponse,
} from "..";

describe("contracts", () => {
  it("normaliza sessao valida", () => {
    const result = normalizeAuthSessionResponse({
      token: "jwt-token",
      user: {
        id: "u1",
        name: "Marcos",
        role: "customer",
        savedAddresses: [],
      },
    });

    expect(result.token).toBe("jwt-token");
    expect(result.user).toEqual({
      id: "u1",
      name: "Marcos",
      role: "customer",
      savedAddresses: [],
    });
  });

  it("falha rapido em campo critico ausente", () => {
    expect(() => normalizeMenuItemResponse({})).toThrow(ContractError);
  });

  it("normaliza opcional com fallback", () => {
    const result = normalizeReservationResponse({
      id: "r1",
      branchId: "b1",
      branchName: "Centro",
      scheduledAt: "2026-04-30T20:00:00.000Z",
      guests: 2,
      depthLevel: "Interno",
      status: "confirmed",
    });

    expect(result.specialRequest).toBe("");
  });

  it("normaliza request de auth", () => {
    const request = buildAuthRequest({
      email: " USER@MAIL.COM ",
      password: "123456",
    });

    expect(request.email).toBe("user@mail.com");
    expect(request.name).toBeUndefined();
  });

  it("bloqueia item de pedido invalido", () => {
    expect(() =>
      buildOrderRequest({
        fulfillmentType: "delivery",
        paymentMethod: "in_app_card_tokenized",
        contactName: "Ana",
        deliveryAddress: "Rua A",
        items: [{ menuItemId: "m1", quantity: -1 }],
      }),
    ).toThrow(ContractError);
  });
});
