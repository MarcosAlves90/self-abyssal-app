import { createContractError } from "./errors";

function fail({ entity, field, code = "INVALID_CONTRACT", message }) {
  throw createContractError({
    code,
    entity,
    field,
    safeMessage: message,
  });
}

export function asOptionalString(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = value.trim();
    return parsed || undefined;
  }

  const parsed = String(value).trim();
  return parsed || undefined;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function requiredString(value, { entity, field, trim = true }) {
  if (typeof value !== "string") {
    fail({ entity, field, code: "REQUIRED_STRING", message: `${entity}.${field} precisa ser texto.` });
  }

  const parsed = trim ? value.trim() : value;

  if (!parsed) {
    fail({ entity, field, code: "REQUIRED_STRING", message: `${entity}.${field} e obrigatorio.` });
  }

  return parsed;
}

export function requiredStringWithLength(value, { entity, field, min, max, trim = true }) {
  const parsed = requiredString(value, { entity, field, trim });

  if (typeof min === "number" && parsed.length < min) {
    fail({ entity, field, code: "INVALID_LENGTH", message: `${entity}.${field} invalido.` });
  }

  if (typeof max === "number" && parsed.length > max) {
    fail({ entity, field, code: "INVALID_LENGTH", message: `${entity}.${field} invalido.` });
  }

  return parsed;
}

export function optionalStringWithLength(value, { entity, field, min, max }) {
  const parsed = optionalString(value);

  if (parsed === undefined) {
    return undefined;
  }

  if (typeof min === "number" && parsed.length < min) {
    fail({ entity, field, code: "INVALID_LENGTH", message: `${entity}.${field} invalido.` });
  }

  if (typeof max === "number" && parsed.length > max) {
    fail({ entity, field, code: "INVALID_LENGTH", message: `${entity}.${field} invalido.` });
  }

  return parsed;
}

export function optionalString(value) {
  return asOptionalString(value);
}

export function requiredId(value, { entity, field = "id" }) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return requiredString(value, { entity, field });
}

export function requiredEmail(value, { entity, field = "email" }) {
  const email = requiredString(value, { entity, field }).toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValid) {
    fail({ entity, field, code: "INVALID_EMAIL", message: `${entity}.${field} invalido.` });
  }

  return email;
}

export function requiredPositiveInteger(value, { entity, field }) {
  const parsed = Math.trunc(Number(value));

  if (!Number.isFinite(parsed) || parsed < 0) {
    fail({ entity, field, code: "INVALID_NUMBER", message: `${entity}.${field} invalido.` });
  }

  return parsed;
}

export function requiredIntegerInRange(value, { entity, field, min, max }) {
  const parsed = requiredPositiveInteger(value, { entity, field });

  if (parsed < min || parsed > max) {
    fail({ entity, field, code: "INVALID_NUMBER", message: `${entity}.${field} invalido.` });
  }

  return parsed;
}

export function requiredIsoDate(value, { entity, field }) {
  const parsed = requiredString(value, { entity, field });

  if (Number.isNaN(Date.parse(parsed))) {
    fail({ entity, field, code: "INVALID_DATE", message: `${entity}.${field} invalido.` });
  }

  return parsed;
}

export function requiredPattern(value, { entity, field, regex }) {
  const parsed = requiredString(value, { entity, field });

  if (!regex.test(parsed)) {
    fail({ entity, field, code: "INVALID_PATTERN", message: `${entity}.${field} invalido.` });
  }

  return parsed;
}

export function safeMaskEmail(value) {
  if (!value || typeof value !== "string") {
    return "***";
  }

  const [name, domain] = value.split("@");
  if (!name || !domain) {
    return "***";
  }

  return `${name.slice(0, 1)}***@${domain}`;
}

export function safeMaskPostalCode(value) {
  if (!value || typeof value !== "string") {
    return "***";
  }

  const digits = value.replaceAll(/\D/g, "");
  if (!digits.length) {
    return "***";
  }

  return `${digits.slice(0, 2)}***`;
}
