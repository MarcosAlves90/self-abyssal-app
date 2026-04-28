jest.mock("axios", () => {
  const create = jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
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

describe("api contract integration", () => {
  beforeEach(() => {
    jest.resetModules();
    global.__DEV__ = true;
  });

  it("falha rapido para resposta invalida de login", async () => {
    const axios = require("axios").default;
    const { loginAccount } = require("../../services/api");
    const client = axios.create.mock.results[0].value;

    client.post.mockResolvedValueOnce({ data: { user: { id: "u1", name: "Ana", role: "customer" } } });

    await expect(loginAccount({ email: "ana@mail.com", password: "12345678" })).rejects.toMatchObject({
      name: "ContractError",
      field: "token",
    });
  });

  it("retorna shape normalizado em fetchMenu", async () => {
    const axios = require("axios").default;
    const { fetchMenu } = require("../../services/api");
    const client = axios.create.mock.results[0].value;

    client.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: "m1",
            name: "Ravioli",
            description: "Molho da casa",
            category: "principais",
            priceCents: 6500,
            isFeatured: 1,
          },
        ],
      },
    });

    await expect(fetchMenu()).resolves.toEqual([
      expect.objectContaining({
        id: "m1",
        name: "Ravioli",
        isFeatured: true,
      }),
    ]);
  });
});
