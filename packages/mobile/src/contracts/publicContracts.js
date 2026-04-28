function asString(value, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function asOptionalString(value) {
  const parsed = asString(value, "").trim();
  return parsed || undefined;
}

function asPositiveInteger(value, fallback = 0) {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAddress(address) {
  return {
    label: asString(address?.label),
    postalCode: asString(address?.postalCode),
    street: asString(address?.street),
    number: asString(address?.number),
    complement: asString(address?.complement),
    neighborhood: asString(address?.neighborhood),
    city: asString(address?.city),
    state: asString(address?.state),
  };
}

export function normalizeUserContract(raw) {
  return {
    id: asString(raw?.id),
    name: asString(raw?.name),
    email: asString(raw?.email),
    role: asString(raw?.role),
    phone: asString(raw?.phone),
    savedAddresses: asArray(raw?.savedAddresses).map(normalizeAddress),
  };
}

export function normalizeAuthSessionContract(raw) {
  return {
    token: asString(raw?.token),
    user: normalizeUserContract(raw?.user),
  };
}

export function normalizeBranchContract(raw) {
  return {
    id: asString(raw?.id),
    name: asString(raw?.name),
    city: asString(raw?.city),
    neighborhood: asString(raw?.neighborhood),
    openHours: asString(raw?.openHours),
    addressLine: asString(raw?.addressLine),
    reservationDepths: asArray(raw?.reservationDepths).map((value) => asString(value)).filter(Boolean),
  };
}

export function normalizeMenuItemContract(raw) {
  return {
    id: asString(raw?.id),
    name: asString(raw?.name),
    description: asString(raw?.description),
    category: asString(raw?.category),
    priceCents: asPositiveInteger(raw?.priceCents),
    imageUrl: asOptionalString(raw?.imageUrl),
    imageHint: asOptionalString(raw?.imageHint),
    accentColor: asOptionalString(raw?.accentColor),
    isFeatured: Boolean(raw?.isFeatured),
    availableForDineIn: Boolean(raw?.availableForDineIn),
    availableForDelivery: Boolean(raw?.availableForDelivery),
  };
}

export function normalizeReservationContract(raw) {
  return {
    id: asString(raw?.id),
    branchId: asString(raw?.branchId),
    branchName: asString(raw?.branchName),
    scheduledAt: asString(raw?.scheduledAt),
    guests: asPositiveInteger(raw?.guests),
    depthLevel: asString(raw?.depthLevel),
    specialRequest: asString(raw?.specialRequest),
    status: asString(raw?.status),
  };
}

export function normalizeOrderContract(raw) {
  return {
    id: asString(raw?.id),
    createdAt: asString(raw?.createdAt),
    status: asString(raw?.status),
    fulfillmentType: asString(raw?.fulfillmentType),
    totalCents: asPositiveInteger(raw?.totalCents),
  };
}

export function buildAddressPayloadContract(input) {
  return {
    label: asString(input?.label),
    postalCode: asString(input?.postalCode),
    street: asString(input?.street),
    number: asString(input?.number),
    complement: asOptionalString(input?.complement),
    neighborhood: asString(input?.neighborhood),
    city: asString(input?.city),
    state: asString(input?.state),
  };
}

export function buildAuthPayloadContract(input) {
  return {
    name: asOptionalString(input?.name),
    email: asString(input?.email).trim().toLowerCase(),
    password: asString(input?.password),
  };
}

export function buildReservationPayloadContract(input) {
  return {
    branchId: asString(input?.branchId),
    scheduledAt: asString(input?.scheduledAt),
    guests: asPositiveInteger(input?.guests),
    depthLevel: asString(input?.depthLevel),
    specialRequest: asOptionalString(input?.specialRequest),
  };
}

export function buildOrderPayloadContract(input) {
  return {
    fulfillmentType: asString(input?.fulfillmentType),
    paymentMethod: asString(input?.paymentMethod),
    contactName: asString(input?.contactName),
    deliveryAddress: asString(input?.deliveryAddress),
    items: asArray(input?.items).map((item) => ({
      menuItemId: asString(item?.menuItemId),
      quantity: asPositiveInteger(item?.quantity, 1),
      note: asOptionalString(item?.note),
    })),
  };
}

export function buildCartItemContract(menuItem) {
  return {
    id: asString(menuItem?.id),
    name: asString(menuItem?.name),
    priceCents: asPositiveInteger(menuItem?.priceCents),
    quantity: 1,
    note: "",
  };
}
