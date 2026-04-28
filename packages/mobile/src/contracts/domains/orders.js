import {
  asArray,
  optionalString,
  requiredId,
  requiredIsoDate,
  requiredPositiveInteger,
  requiredString,
} from "../contractPrimitives";

const ENTITY_ORDER = "Order";
const ENTITY_ORDER_REQUEST = "OrderRequest";

export function normalizeOrderResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_ORDER }),
    createdAt: requiredIsoDate(raw?.createdAt, { entity: ENTITY_ORDER, field: "createdAt" }),
    status: requiredString(raw?.status, { entity: ENTITY_ORDER, field: "status" }),
    fulfillmentType: requiredString(raw?.fulfillmentType, { entity: ENTITY_ORDER, field: "fulfillmentType" }),
    totalCents: requiredPositiveInteger(raw?.totalCents, { entity: ENTITY_ORDER, field: "totalCents" }),
  };
}

export function buildOrderRequest(input) {
  return {
    fulfillmentType: requiredString(input?.fulfillmentType, { entity: ENTITY_ORDER_REQUEST, field: "fulfillmentType" }),
    paymentMethod: requiredString(input?.paymentMethod, { entity: ENTITY_ORDER_REQUEST, field: "paymentMethod" }),
    contactName: requiredString(input?.contactName, { entity: ENTITY_ORDER_REQUEST, field: "contactName" }),
    deliveryAddress: requiredString(input?.deliveryAddress, { entity: ENTITY_ORDER_REQUEST, field: "deliveryAddress" }),
    items: asArray(input?.items).map((item) => ({
      menuItemId: requiredId(item?.menuItemId, { entity: ENTITY_ORDER_REQUEST, field: "items.menuItemId" }),
      quantity: requiredPositiveInteger(item?.quantity, { entity: ENTITY_ORDER_REQUEST, field: "items.quantity" }),
      note: optionalString(item?.note),
    })),
  };
}
