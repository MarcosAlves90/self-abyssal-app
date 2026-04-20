export function createEmptyAddress() {
  return {
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  };
}

export function normalizePostalCode(value = "") {
  return value.replaceAll(/\D/g, "").slice(0, 8);
}

export function formatPostalCode(value = "") {
  const digits = normalizePostalCode(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function buildAddressSummary(address) {
  const firstLine = [address.street, address.number].filter(Boolean).join(", ");
  const secondLine = [address.complement, address.neighborhood].filter(Boolean).join(", ");
  const thirdLine = [
    [address.city, address.state].filter(Boolean).join(" - "),
    address.postalCode ? `CEP ${formatPostalCode(address.postalCode)}` : ""
  ]
    .filter(Boolean)
    .join(" • ");

  return [firstLine, secondLine, thirdLine].filter(Boolean).join(" • ");
}

export function hasAddressData(address) {
  return Object.values(address || {}).some(Boolean);
}

export function isAddressComplete(address) {
  return (
    normalizePostalCode(address?.postalCode).length === 8 &&
    Boolean(address?.street?.trim()) &&
    Boolean(address?.number?.trim()) &&
    Boolean(address?.neighborhood?.trim()) &&
    Boolean(address?.city?.trim()) &&
    Boolean(address?.state?.trim())
  );
}

export function mapSavedAddressToForm(savedAddress) {
  if (!savedAddress) {
    return createEmptyAddress();
  }

  return {
    postalCode: formatPostalCode(savedAddress.postalCode || ""),
    street: savedAddress.street || "",
    number: savedAddress.number || "",
    complement: savedAddress.complement || "",
    neighborhood: savedAddress.neighborhood || "",
    city: savedAddress.city || "",
    state: savedAddress.state || ""
  };
}
