export class ContractError extends Error {
  constructor({ code, entity, field, safeMessage }) {
    super(safeMessage);
    this.name = "ContractError";
    this.code = code;
    this.entity = entity;
    this.field = field;
    this.safeMessage = safeMessage;
  }
}

export function createContractError({ code, entity, field, safeMessage }) {
  return new ContractError({ code, entity, field, safeMessage });
}
