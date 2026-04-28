import {
  asArray,
  optionalString,
  requiredEmail,
  requiredId,
  requiredString,
} from "../contractPrimitives";
import { normalizeAddressResponse } from "./address";

const ENTITY_USER = "User";
const ENTITY_AUTH_SESSION = "AuthSession";
const ENTITY_AUTH_REQUEST = "AuthRequest";

export function normalizeUserResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_USER, field: "id" }),
    name: requiredString(raw?.name, { entity: ENTITY_USER, field: "name" }),
    role: requiredString(raw?.role, { entity: ENTITY_USER, field: "role" }),
    savedAddresses: asArray(raw?.savedAddresses).map(normalizeAddressResponse),
  };
}

export function normalizeAuthSessionResponse(raw) {
  return {
    token: requiredString(raw?.token, { entity: ENTITY_AUTH_SESSION, field: "token", trim: false }),
    user: normalizeUserResponse(raw?.user),
  };
}

export function buildAuthRequest(input) {
  return {
    name: optionalString(input?.name),
    email: requiredEmail(input?.email, { entity: ENTITY_AUTH_REQUEST, field: "email" }),
    password: requiredString(input?.password, { entity: ENTITY_AUTH_REQUEST, field: "password", trim: false }),
    phone: optionalString(input?.phone),
  };
}
