import {
  asBoolean,
  optionalString,
  requiredId,
  requiredPositiveInteger,
  requiredString,
} from "../contractPrimitives";

const ENTITY_MENU_ITEM = "MenuItem";

export function normalizeMenuItemResponse(raw) {
  return {
    id: requiredId(raw?.id, { entity: ENTITY_MENU_ITEM }),
    name: requiredString(raw?.name, { entity: ENTITY_MENU_ITEM, field: "name" }),
    description: requiredString(raw?.description, { entity: ENTITY_MENU_ITEM, field: "description" }),
    category: requiredString(raw?.category, { entity: ENTITY_MENU_ITEM, field: "category" }),
    priceCents: requiredPositiveInteger(raw?.priceCents, { entity: ENTITY_MENU_ITEM, field: "priceCents" }),
    imageUrl: optionalString(raw?.imageUrl),
    imageHint: optionalString(raw?.imageHint),
    accentColor: optionalString(raw?.accentColor),
    isFeatured: asBoolean(raw?.isFeatured),
    availableForDineIn: asBoolean(raw?.availableForDineIn),
    availableForDelivery: asBoolean(raw?.availableForDelivery),
  };
}

export function buildCartItemRequest(menuItem) {
  return {
    id: requiredId(menuItem?.id, { entity: "CartItem", field: "id" }),
    name: requiredString(menuItem?.name, { entity: "CartItem", field: "name" }),
    priceCents: requiredPositiveInteger(menuItem?.priceCents, { entity: "CartItem", field: "priceCents" }),
    quantity: 1,
    note: "",
  };
}
