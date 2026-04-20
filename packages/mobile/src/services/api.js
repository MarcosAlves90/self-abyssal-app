import axios from "axios";
import { Platform } from "react-native";

const fallbackBaseUrl = Platform.select({
  android: "http://10.0.2.2:3333/api",
  default: "http://localhost:3333/api"
});

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || fallbackBaseUrl,
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
