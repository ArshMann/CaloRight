const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type RequestOptions = {
  method?: HttpMethod;
  accessToken?: string | null;
  body?: unknown;
  retryOn401?: boolean;
};

async function parseJsonOrNull(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const method = opts.method ?? "GET";
  const retryOn401 = opts.retryOn401 ?? true;

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.accessToken) headers["Authorization"] = `Bearer ${opts.accessToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include", // IMPORTANT: needed for refresh cookie
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // If unauthorized, we will optionally let caller retry after refresh
  if (res.status === 401 && retryOn401) {
    throw new ApiError(401, "UNAUTHORIZED");
  }

  if (!res.ok) {
    const data = await parseJsonOrNull(res);
    const code = data?.error?.code;
    const message =
      data?.error?.message ??
      data?.message ??
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, code);
  }

  const data = (await parseJsonOrNull(res)) as T;
  return data;
}
