import {
  asArray,
  requiredEmail,
  requiredId,
  requiredPattern,
  requiredString,
  requiredStringWithLength,
} from "../contractPrimitives";
import { normalizeAddressResponse } from "./address";

const ENTITY_USER = "User";
const ENTITY_AUTH_SESSION = "AuthSession";
const ENTITY_LOGIN_REQUEST = "LoginRequest";
const ENTITY_REGISTER_REQUEST = "RegisterRequest";

export function normalizeUserResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_USER, field: "id" }),
    name: requiredString(raw?.name, { entity: ENTITY_USER, field: "name" }),
    email: requiredEmail(raw?.email, { entity: ENTITY_USER, field: "email" }),
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

export function buildLoginRequest(input) {
  return {
    email: requiredEmail(input?.email, { entity: ENTITY_LOGIN_REQUEST, field: "email" }),
    password: requiredStringWithLength(input?.password, {
      entity: ENTITY_LOGIN_REQUEST,
      field: "password",
      min: 8,
      max: 128,
      trim: false,
    }),
  };
}

export function buildRegisterRequest(input) {
  return {
    name: requiredStringWithLength(input?.name, {
      entity: ENTITY_REGISTER_REQUEST,
      field: "name",
      min: 3,
      max: 80,
    }),
    email: requiredEmail(input?.email, { entity: ENTITY_REGISTER_REQUEST, field: "email" }),
    password: requiredStringWithLength(input?.password, {
      entity: ENTITY_REGISTER_REQUEST,
      field: "password",
      min: 8,
      max: 128,
      trim: false,
    }),
    phone: requiredPattern(input?.phone, {
      entity: ENTITY_REGISTER_REQUEST,
      field: "phone",
      regex: /^\d{10,11}$/,
    }),
  };
}
