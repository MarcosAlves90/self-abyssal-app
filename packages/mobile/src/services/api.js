import axios from "axios";
import { Platform } from "react-native";

import {
  buildAddressRequest,
  buildLoginRequest,
  buildOrderRequest,
  buildRegisterRequest,
  buildReservationRequest,
  normalizeAuthSessionResponse,
  normalizeBranchResponse,
  normalizeMenuItemResponse,
  normalizeOrderResponse,
  normalizePostalLookupResponse,
  normalizeReservationResponse,
  normalizeUserResponse,
} from "../contracts";
import { formatPostalCode, normalizePostalCode } from "../utils/address";

const isDevelopment = __DEV__;
const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

const fallbackBaseUrl = isDevelopment
  ? Platform.select({
      android: "http://10.0.2.2:3334/api",
      web: "http://127.0.0.1:3334/api",
      default: "http://localhost:3334/api"
    })
  : undefined;

function resolveDevelopmentBaseUrl(baseUrl) {
  if (!baseUrl || !isDevelopment) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (!isLocalHost) {
      return baseUrl;
    }

    if (Platform.OS === "web") {
      url.protocol = "http:";
      url.hostname = "127.0.0.1";
      url.port = "3334";

      return url.toString().replace(/\/$/, "");
    }

    return undefined;
  } catch {
    return baseUrl;
  }
}

function normalizeProductionBaseUrl(baseUrl) {
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL e obrigatoria em producao.");
  }

  let url;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("EXPO_PUBLIC_API_BASE_URL deve ser uma URL HTTPS valida em producao.");
  }

  if (url.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_BASE_URL deve usar HTTPS em producao.");
  }

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    throw new Error("EXPO_PUBLIC_API_BASE_URL nao pode apontar para localhost em producao.");
  }

  return url.toString().replace(/\/$/, "");
}

const baseURL = isDevelopment
  ? resolveDevelopmentBaseUrl(configuredBaseUrl) || fallbackBaseUrl
  : normalizeProductionBaseUrl(configuredBaseUrl);

export const api = axios.create({
  baseURL,
  timeout: 12000
});

export const authApi = axios.create({
  baseURL,
  timeout: 12000
});

function normalizeRequestConfig(config = {}) {
  return Object.keys(config).length > 0 ? config : undefined;
}

export function isAbortedRequest(error) {
  return (
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.message === "canceled"
  );
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiErrorMessage(error) {
  if (isAbortedRequest(error)) {
    return "Requisição cancelada.";
  }

  if (error?.safeMessage) {
    return error.safeMessage;
  }

  return (
    error?.response?.data?.message ||
    "Não foi possível concluir a operação no momento."
  );
}

export async function registerAccount(payload, config = {}) {
  const { data } = await authApi.post(
    "/auth/register",
    buildRegisterRequest(payload),
    normalizeRequestConfig(config)
  );
  return normalizeAuthSessionResponse(data);
}

export async function loginAccount(payload, config = {}) {
  const { data } = await authApi.post(
    "/auth/login",
    buildLoginRequest(payload),
    normalizeRequestConfig(config)
  );
  return normalizeAuthSessionResponse(data);
}

export async function fetchMe(config = {}) {
  const { data } = await api.get("/auth/me", normalizeRequestConfig(config));
  return normalizeUserResponse(data.user);
}

export async function savePrimaryAddress(payload, config = {}) {
  const { data } = await api.put(
    "/auth/me/address",
    buildAddressRequest(payload),
    normalizeRequestConfig(config)
  );
  return normalizeUserResponse(data.user);
}

export async function fetchBranches(config = {}) {
  const { data } = await api.get("/branches", normalizeRequestConfig(config));
  return (data.branches || []).map(normalizeBranchResponse);
}

export async function fetchMenu(params = {}, config = {}) {
  const requestConfig = normalizeRequestConfig(config);
  const { data } = await api.get(
    "/menu",
    requestConfig ? { params, ...requestConfig } : { params }
  );
  return (data.items || []).map(normalizeMenuItemResponse);
}

export async function fetchReservations(config = {}) {
  const { data } = await api.get("/reservations", normalizeRequestConfig(config));
  return (data.reservations || []).map(normalizeReservationResponse);
}

export async function createReservation(payload, config = {}) {
  const { data } = await api.post(
    "/reservations",
    buildReservationRequest(payload),
    normalizeRequestConfig(config)
  );
  return normalizeReservationResponse(data.reservation);
}

export async function cancelReservation(reservationId, config = {}) {
  await api.delete(`/reservations/${reservationId}`, normalizeRequestConfig(config));
}


export async function fetchOrders(config = {}) {
  const { data } = await api.get("/orders", normalizeRequestConfig(config));
  return (data.orders || []).map(normalizeOrderResponse);
}

export async function createOrder(payload, config = {}) {
  const { data } = await api.post(
    "/orders",
    buildOrderRequest(payload),
    normalizeRequestConfig(config)
  );
  return data.order || data;
}

export async function cancelOrder(orderId, config = {}) {
  await api.patch(
    `/orders/${orderId}`,
    { status: "cancelled" },
    normalizeRequestConfig(config)
  );
}

export async function lookupPostalCode(postalCode, config = {}) {
  const normalizedPostalCode = normalizePostalCode(postalCode);

  if (normalizedPostalCode.length !== 8) {
    throw new Error("Informe um CEP com 8 digitos.");
  }

  const { data } = await axios.get(`https://viacep.com.br/ws/${normalizedPostalCode}/json/`, {
    timeout: 8000,
    ...normalizeRequestConfig(config)
  });

  if (data.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return normalizePostalLookupResponse({
    postalCode: formatPostalCode(normalizedPostalCode),
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
    complement: data.complemento || ""
  });
}
