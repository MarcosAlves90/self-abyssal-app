jest.mock("axios", () => {
  const create = jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    defaults: { headers: { common: {} } },
  }));

  return {
    __esModule: true,
    default: {
      create,
      get: jest.fn(),
    },
    create,
    get: jest.fn(),
  };
});

jest.mock("react-native", () => ({
  Platform: {
    OS: "web",
    select: ({ web }) => web,
  },
}));

jest.mock(
  "expo/virtual/env",
  () => ({
    env: {},
  }),
  { virtual: true },
);

describe("api service auth headers", () => {
  beforeEach(() => {
    jest.resetModules();
    globalThis.__DEV__ = true;
  });

  it("usa uma instancia publica separada para login", async () => {
    const axios = require("axios").default;
    const { authApi, loginAccount } = require("../api");
    const authClient = axios.create.mock.results[1].value;

    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(authApi).toBe(authClient);

    authClient.post.mockResolvedValueOnce({
      data: {
        token: "jwt-token",
        user: {
          id: "u1",
          name: "Ana",
          email: "ana@mail.com",
          role: "customer",
          savedAddresses: [],
        },
      },
    });

    await loginAccount({ email: "ana@mail.com", password: "12345678" });
    expect(authClient.post).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        email: "ana@mail.com",
      }),
    );
  });

  it("cancela um pedido usando o status cancelled", async () => {
    const axios = require("axios").default;
    const { api, cancelOrder } = require("../api");
    const client = axios.create.mock.results[0].value;

    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(api).toBe(client);

    client.patch.mockResolvedValueOnce({});

    await cancelOrder("order-123");

    expect(client.patch).toHaveBeenCalledWith("/orders/order-123", {
      status: "cancelled",
    });
  });
});
