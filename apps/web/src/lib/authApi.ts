import { apiRequest } from "./apiClient";

export type User = { id: string; email: string };

export async function apiLogin(email: string, password: string) {
  return apiRequest<{ accessToken: string; user: User }>("/auth/login", {
    method: "POST",
    body: { email, password },
    retryOn401: false,
  });
}

export async function apiRegister(email: string, password: string) {
  return apiRequest<{ user: User }>("/auth/register", {
    method: "POST",
    body: { email, password },
    retryOn401: false,
  });
}

export async function apiMe(accessToken: string) {
  return apiRequest<{ user: User }>("/auth/me", {
    method: "GET",
    accessToken,
    retryOn401: false,
  });
}

export async function apiRefresh() {
  return apiRequest<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    retryOn401: false,
  });
}

export async function apiLogout() {
  // 204 no content
  await apiRequest<null>("/auth/logout", {
    method: "POST",
    retryOn401: false,
  });
}
