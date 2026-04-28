import {
  asArray,
  requiredId,
  requiredString,
} from "../contractPrimitives";

const ENTITY_BRANCH = "Branch";

export function normalizeBranchResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_BRANCH }),
    name: requiredString(raw?.name, { entity: ENTITY_BRANCH, field: "name" }),
    city: requiredString(raw?.city, { entity: ENTITY_BRANCH, field: "city" }),
    neighborhood: requiredString(raw?.neighborhood, { entity: ENTITY_BRANCH, field: "neighborhood" }),
    openHours: requiredString(raw?.openHours, { entity: ENTITY_BRANCH, field: "openHours" }),
    addressLine: requiredString(raw?.addressLine, { entity: ENTITY_BRANCH, field: "addressLine" }),
    reservationDepths: asArray(raw?.reservationDepths)
      .map((value) => requiredString(value, { entity: ENTITY_BRANCH, field: "reservationDepths" }))
      .filter(Boolean),
  };
}
