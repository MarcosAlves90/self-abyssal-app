import {
  asArray,
  optionalStringWithLength,
  requiredIntegerInRange,
  requiredId,
  requiredIsoDate,
  requiredPositiveInteger,
  requiredPattern,
  requiredString,
  requiredStringWithLength,
} from "../contractPrimitives";

const ENTITY_ORDER = "Order";
const ENTITY_ORDER_REQUEST = "OrderRequest";

function normalizeOrderCreatedAt(value) {
  if (typeof value === "string") {
    return requiredIsoDate(value, { entity: ENTITY_ORDER, field: "createdAt" });
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const epochMs = value > 1e12 ? value : value * 1000;
    const parsed = new Date(epochMs);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (value && typeof value === "object") {
    const epochSecond =
      typeof value.epochSecond === "number"
        ? value.epochSecond
        : typeof value.seconds === "number"
          ? value.seconds
          : null;
    const nanoAdjustment =
      typeof value.nano === "number"
        ? value.nano
        : typeof value.nanos === "number"
          ? value.nanos
          : 0;

    if (epochSecond !== null) {
      const epochMs = epochSecond * 1000 + Math.trunc(nanoAdjustment / 1e6);
      const parsed = new Date(epochMs);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  return requiredIsoDate(value, { entity: ENTITY_ORDER, field: "createdAt" });
}

export function normalizeOrderResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_ORDER }),
    createdAt: normalizeOrderCreatedAt(raw?.createdAt),
    status: requiredString(raw?.status, { entity: ENTITY_ORDER, field: "status" }),
    fulfillmentType: requiredString(raw?.fulfillmentType, { entity: ENTITY_ORDER, field: "fulfillmentType" }),
    totalCents: requiredPositiveInteger(raw?.totalCents, { entity: ENTITY_ORDER, field: "totalCents" }),
  };
}

export function buildOrderRequest(input) {
  const fulfillmentType = requiredPattern(input?.fulfillmentType, {
    entity: ENTITY_ORDER_REQUEST,
    field: "fulfillmentType",
    regex: /^(delivery|dine_in)$/,
  });

  return {
    fulfillmentType,
    paymentMethod: requiredPattern(input?.paymentMethod, {
      entity: ENTITY_ORDER_REQUEST,
      field: "paymentMethod",
      regex: /^(in_app_card_tokenized|card_on_delivery|on_site)$/,
    }),
    contactName: optionalStringWithLength(input?.contactName, {
      entity: ENTITY_ORDER_REQUEST,
      field: "contactName",
      min: 3,
      max: 80,
    }),
    deliveryAddress:
      fulfillmentType === "delivery"
        ? requiredStringWithLength(input?.deliveryAddress, {
            entity: ENTITY_ORDER_REQUEST,
            field: "deliveryAddress",
            min: 10,
            max: 200,
          })
        : optionalStringWithLength(input?.deliveryAddress, {
            entity: ENTITY_ORDER_REQUEST,
            field: "deliveryAddress",
            min: 10,
            max: 200,
          }),
    items: asArray(input?.items).map((item) => ({
      menuItemId: requiredId(item?.menuItemId, { entity: ENTITY_ORDER_REQUEST, field: "items.menuItemId" }),
      quantity: requiredIntegerInRange(item?.quantity, {
        entity: ENTITY_ORDER_REQUEST,
        field: "items.quantity",
        min: 1,
        max: 20,
      }),
      note: optionalStringWithLength(item?.note, {
        entity: ENTITY_ORDER_REQUEST,
        field: "items.note",
        max: 120,
      }),
    })),
  };
}
