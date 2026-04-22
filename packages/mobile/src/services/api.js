import axios from "axios";
import { Platform } from "react-native";

import { formatPostalCode, normalizePostalCode } from "../utils/address";

const isDevelopment = __DEV__;

const fallbackBaseUrl = isDevelopment
  ? Platform.select({
      android: "http://10.0.2.2:3333/api",
      web: "https://127.0.0.1:3333/api",
      default: "http://localhost:3333/api"
    })
  : undefined;

function normalizeWebBaseUrl(baseUrl) {
  if (!baseUrl || Platform.OS !== "web" || !isDevelopment) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);

    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      url.protocol = "https:";
    }

    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return baseUrl;
  }
}

export const api = axios.create({
  baseURL: normalizeWebBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) || fallbackBaseUrl,
  timeout: 12000
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    "Nao foi possivel concluir a operacao no momento."
  );
}

export async function registerAccount(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginAccount(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function savePrimaryAddress(payload) {
  const { data } = await api.put("/auth/me/address", payload);
  return data.user;
}

export async function fetchBranches() {
  const { data } = await api.get("/branches");
  return data.branches;
}

export async function fetchMenu(params = {}) {
  const { data } = await api.get("/menu", { params });
  return data.items;
}

export async function fetchReservations() {
  const { data } = await api.get("/reservations");
  return data.reservations;
}

export async function createReservation(payload) {
  const { data } = await api.post("/reservations", payload);
  return data.reservation;
}

export async function fetchOrders() {
  const { data } = await api.get("/orders");
  return data.orders;
}

export async function createOrder(payload) {
  const { data } = await api.post("/orders", payload);
  return data.order;
}

export async function lookupPostalCode(postalCode) {
  const normalizedPostalCode = normalizePostalCode(postalCode);

  if (normalizedPostalCode.length !== 8) {
    throw new Error("Informe um CEP com 8 digitos.");
  }

  const { data } = await axios.get(`https://viacep.com.br/ws/${normalizedPostalCode}/json/`, {
    timeout: 8000
  });

  if (data.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return {
    postalCode: formatPostalCode(normalizedPostalCode),
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
    complement: data.complemento || ""
  };
}
