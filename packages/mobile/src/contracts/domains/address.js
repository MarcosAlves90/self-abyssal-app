import {
  optionalStringWithLength,
  requiredPattern,
  requiredString,
  requiredStringWithLength,
} from "../contractPrimitives";

const ENTITY_ADDRESS = "Address";
const ENTITY_ADDRESS_REQUEST = "AddressRequest";
const ENTITY_POSTAL_LOOKUP_RESPONSE = "PostalLookupResponse";

function buildAddressSummaryFallback(address) {
  const firstLine = [address.street, address.number].filter(Boolean).join(", ");
  const secondLine = [address.complement, address.neighborhood].filter(Boolean).join(", ");
  const thirdLine = [address.city, address.state].filter(Boolean).join(" - ");

  return [firstLine, secondLine, thirdLine].filter(Boolean).join(" • ");
}

function normalizeAddress(raw) {
  const normalized = {
    label: optionalStringWithLength(raw?.label, {
      entity: ENTITY_ADDRESS,
      field: "label",
      min: 2,
      max: 40,
    }) || "",
    postalCode: requiredString(raw?.postalCode, { entity: ENTITY_ADDRESS, field: "postalCode" }),
    street: requiredString(raw?.street, { entity: ENTITY_ADDRESS, field: "street" }),
    number: requiredString(raw?.number, { entity: ENTITY_ADDRESS, field: "number" }),
    complement: optionalStringWithLength(raw?.complement, {
      entity: ENTITY_ADDRESS,
      field: "complement",
      min: 1,
      max: 80,
    }) || "",
    neighborhood: requiredString(raw?.neighborhood, { entity: ENTITY_ADDRESS, field: "neighborhood" }),
    city: requiredString(raw?.city, { entity: ENTITY_ADDRESS, field: "city" }),
    state: requiredString(raw?.state, { entity: ENTITY_ADDRESS, field: "state" }),
    summary: optionalStringWithLength(raw?.summary, {
      entity: ENTITY_ADDRESS,
      field: "summary",
    }) || "",
  };

  if (!normalized.summary) {
    normalized.summary = buildAddressSummaryFallback(normalized);
  }

  return normalized;
}

export function normalizeAddressResponse(raw) {
  return normalizeAddress(raw);
}

export function normalizePostalLookupResponse(raw) {
  return {
    postalCode: requiredString(raw?.postalCode, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "postalCode" }),
    street: optionalStringWithLength(raw?.street, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "street" }) || "",
    neighborhood: optionalStringWithLength(raw?.neighborhood, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "neighborhood" }) || "",
    city: optionalStringWithLength(raw?.city, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "city" }) || "",
    state: optionalStringWithLength(raw?.state, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "state" }) || "",
    complement: optionalStringWithLength(raw?.complement, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "complement" }) || "",
  };
}

export function buildAddressRequest(input) {
  return {
    label: optionalStringWithLength(input?.label, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "label",
      min: 2,
      max: 40,
    }),
    postalCode: requiredPattern(input?.postalCode, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "postalCode",
      regex: /^\d{5}-?\d{3}$/,
    }),
    street: requiredStringWithLength(input?.street, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "street",
      min: 3,
      max: 120,
    }),
    number: requiredStringWithLength(input?.number, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "number",
      min: 1,
      max: 20,
    }),
    complement: optionalStringWithLength(input?.complement, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "complement",
      min: 1,
      max: 80,
    }),
    neighborhood: requiredStringWithLength(input?.neighborhood, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "neighborhood",
      min: 2,
      max: 80,
    }),
    city: requiredStringWithLength(input?.city, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "city",
      min: 2,
      max: 80,
    }),
    state: requiredPattern(input?.state, {
      entity: ENTITY_ADDRESS_REQUEST,
      field: "state",
      regex: /^[a-zA-Z]{2}$/,
    }),
  };
}
