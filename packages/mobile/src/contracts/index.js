export { ContractError } from "./errors";
export {
  safeMaskEmail,
  safeMaskPostalCode,
} from "./contractPrimitives";

export {
  buildAuthRequest,
  normalizeAuthSessionResponse,
  normalizeUserResponse,
} from "./domains/auth";

export {
  buildAddressRequest,
  normalizeAddressResponse,
  normalizePostalLookupResponse,
} from "./domains/address";

export { normalizeBranchResponse } from "./domains/branches";

export {
  buildCartItemRequest,
  normalizeMenuItemResponse,
} from "./domains/menu";

export {
  buildOrderRequest,
  normalizeOrderResponse,
} from "./domains/orders";

export {
  buildReservationRequest,
  normalizeReservationResponse,
} from "./domains/reservations";
