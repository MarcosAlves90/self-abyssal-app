import {
  optionalString,
  requiredId,
  requiredIsoDate,
  requiredPositiveInteger,
  requiredString,
} from "../contractPrimitives";

const ENTITY_RESERVATION = "Reservation";
const ENTITY_RESERVATION_REQUEST = "ReservationRequest";

export function normalizeReservationResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_RESERVATION }),
    branchId: requiredId(raw?.branchId, { entity: ENTITY_RESERVATION, field: "branchId" }),
    branchName: requiredString(raw?.branchName, { entity: ENTITY_RESERVATION, field: "branchName" }),
    scheduledAt: requiredIsoDate(raw?.scheduledAt, { entity: ENTITY_RESERVATION, field: "scheduledAt" }),
    guests: requiredPositiveInteger(raw?.guests, { entity: ENTITY_RESERVATION, field: "guests" }),
    depthLevel: requiredString(raw?.depthLevel, { entity: ENTITY_RESERVATION, field: "depthLevel" }),
    specialRequest: optionalString(raw?.specialRequest) || "",
    status: requiredString(raw?.status, { entity: ENTITY_RESERVATION, field: "status" }),
  };
}

export function buildReservationRequest(input) {
  return {
    branchId: requiredId(input?.branchId, { entity: ENTITY_RESERVATION_REQUEST, field: "branchId" }),
    scheduledAt: requiredIsoDate(input?.scheduledAt, { entity: ENTITY_RESERVATION_REQUEST, field: "scheduledAt" }),
    guests: requiredPositiveInteger(input?.guests, { entity: ENTITY_RESERVATION_REQUEST, field: "guests" }),
    depthLevel: requiredString(input?.depthLevel, { entity: ENTITY_RESERVATION_REQUEST, field: "depthLevel" }),
    specialRequest: optionalString(input?.specialRequest),
  };
}
