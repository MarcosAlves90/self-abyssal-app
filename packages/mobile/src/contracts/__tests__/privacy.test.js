import { ContractError, safeMaskEmail, safeMaskPostalCode } from "..";

describe("privacy safeguards", () => {
  it("mascara email", () => {
    expect(safeMaskEmail("user@example.com")).toBe("u***@example.com");
  });

  it("mascara cep", () => {
    expect(safeMaskPostalCode("12345-678")).toBe("12***");
  });

  it("nao carrega payload sensivel no erro", () => {
    const error = new ContractError({
      code: "INVALID",
      entity: "AuthSession",
      field: "token",
      safeMessage: "AuthSession.token e obrigatorio.",
    });

    const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
    expect(serialized).not.toContain("example.com");
    expect(serialized).not.toContain("12345-678");
  });
});
