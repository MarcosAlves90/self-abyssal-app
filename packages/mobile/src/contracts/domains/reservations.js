import {
  optionalStringWithLength,
  requiredId,
  requiredIntegerInRange,
  requiredIsoDate,
  requiredString,
  requiredStringWithLength,
} from "../contractPrimitives";

const ENTITY_RESERVATION = "Reservation";
const ENTITY_RESERVATION_REQUEST = "ReservationRequest";

export function normalizeReservationResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_RESERVATION }),
    branchId: requiredId(raw?.branchId, { entity: ENTITY_RESERVATION, field: "branchId" }),
    branchName: requiredString(raw?.branchName, { entity: ENTITY_RESERVATION, field: "branchName" }),
    scheduledAt: requiredIsoDate(raw?.scheduledAt, { entity: ENTITY_RESERVATION, field: "scheduledAt" }),
    guests: requiredIntegerInRange(raw?.guests, {
      entity: ENTITY_RESERVATION,
      field: "guests",
      min: 1,
      max: 12,
    }),
    depthLevel: requiredStringWithLength(raw?.depthLevel, {
      entity: ENTITY_RESERVATION,
      field: "depthLevel",
      min: 3,
      max: 40,
    }),
    specialRequest: optionalStringWithLength(raw?.specialRequest, {
      entity: ENTITY_RESERVATION,
      field: "specialRequest",
      max: 200,
    }) || "",
    status: requiredString(raw?.status, { entity: ENTITY_RESERVATION, field: "status" }),
  };
}

export function buildReservationRequest(input) {
  return {
    branchId: requiredId(input?.branchId, { entity: ENTITY_RESERVATION_REQUEST, field: "branchId" }),
    scheduledAt: requiredIsoDate(input?.scheduledAt, { entity: ENTITY_RESERVATION_REQUEST, field: "scheduledAt" }),
    guests: requiredIntegerInRange(input?.guests, {
      entity: ENTITY_RESERVATION_REQUEST,
      field: "guests",
      min: 1,
      max: 12,
    }),
    depthLevel: requiredStringWithLength(input?.depthLevel, {
      entity: ENTITY_RESERVATION_REQUEST,
      field: "depthLevel",
      min: 3,
      max: 40,
    }),
    specialRequest: optionalStringWithLength(input?.specialRequest, {
      entity: ENTITY_RESERVATION_REQUEST,
      field: "specialRequest",
      max: 200,
    }),
  };
}
