import {
  optionalString,
  requiredString,
} from "../contractPrimitives";

const ENTITY_ADDRESS = "Address";
const ENTITY_ADDRESS_REQUEST = "AddressRequest";
const ENTITY_POSTAL_LOOKUP_RESPONSE = "PostalLookupResponse";

function normalizeAddress(raw) {
  return {
    label: optionalString(raw?.label) || "",
    postalCode: requiredString(raw?.postalCode, { entity: ENTITY_ADDRESS, field: "postalCode" }),
    street: requiredString(raw?.street, { entity: ENTITY_ADDRESS, field: "street" }),
    number: requiredString(raw?.number, { entity: ENTITY_ADDRESS, field: "number" }),
    complement: optionalString(raw?.complement) || "",
    neighborhood: requiredString(raw?.neighborhood, { entity: ENTITY_ADDRESS, field: "neighborhood" }),
    city: requiredString(raw?.city, { entity: ENTITY_ADDRESS, field: "city" }),
    state: requiredString(raw?.state, { entity: ENTITY_ADDRESS, field: "state" }),
  };
}

export function normalizeAddressResponse(raw) {
  return normalizeAddress(raw);
}

export function normalizePostalLookupResponse(raw) {
  return {
    postalCode: requiredString(raw?.postalCode, { entity: ENTITY_POSTAL_LOOKUP_RESPONSE, field: "postalCode" }),
    street: optionalString(raw?.street) || "",
    neighborhood: optionalString(raw?.neighborhood) || "",
    city: optionalString(raw?.city) || "",
    state: optionalString(raw?.state) || "",
    complement: optionalString(raw?.complement) || "",
  };
}

export function buildAddressRequest(input) {
  return {
    label: requiredString(input?.label, { entity: ENTITY_ADDRESS_REQUEST, field: "label" }),
    postalCode: requiredString(input?.postalCode, { entity: ENTITY_ADDRESS_REQUEST, field: "postalCode" }),
    street: requiredString(input?.street, { entity: ENTITY_ADDRESS_REQUEST, field: "street" }),
    number: requiredString(input?.number, { entity: ENTITY_ADDRESS_REQUEST, field: "number" }),
    complement: optionalString(input?.complement),
    neighborhood: requiredString(input?.neighborhood, { entity: ENTITY_ADDRESS_REQUEST, field: "neighborhood" }),
    city: requiredString(input?.city, { entity: ENTITY_ADDRESS_REQUEST, field: "city" }),
    state: requiredString(input?.state, { entity: ENTITY_ADDRESS_REQUEST, field: "state" }),
  };
}
