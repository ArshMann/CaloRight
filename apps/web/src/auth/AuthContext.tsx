import React, { createContext, useContext, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../lib/apiClient";
import { apiLogin, apiLogout, apiMe, apiRefresh, type User } from "../lib/authApi";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isBootstrapping: boolean;
};

type AuthActions = {
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authedRequest: <T>(path: string, opts?: { method?: any; body?: any }) => Promise<T>;
};

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function bootstrap() {
    setIsBootstrapping(true);
    try {
      // Try refresh (cookie-based). If it fails, user stays logged out.
      const r = await apiRefresh();
      setAccessToken(r.accessToken);

      // Fetch /me using the new access token
      const me = await apiMe(r.accessToken);
      setUser(me.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function login(email: string, password: string) {
    const r = await apiLogin(email, password);
    setAccessToken(r.accessToken);
    setUser(r.user);
  }

  async function register(email: string, password: string) {
    // Minimal: register then login
    await apiRequest("/auth/register", { method: "POST", body: { email, password }, retryOn401: false });
    await login(email, password);
  }

  async function logout() {
    try {
      await apiLogout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  // This is the key: make API calls that retry once after refresh on 401
  async function authedRequest<T>(
    path: string,
    opts?: { method?: any; body?: any }
  ): Promise<T> {
    try {
      return await apiRequest<T>(path, {
        method: opts?.method ?? "GET",
        body: opts?.body,
        accessToken,
        retryOn401: true,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // refresh once
        const r = await apiRefresh();
        setAccessToken(r.accessToken);

        // retry once with new token (no infinite loops)
        return await apiRequest<T>(path, {
          method: opts?.method ?? "GET",
          body: opts?.body,
          accessToken: r.accessToken,
          retryOn401: false,
        });
      }
      throw e;
    }
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isBootstrapping,
      bootstrap,
      login,
      register,
      logout,
      authedRequest,
    }),
    [user, accessToken, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
