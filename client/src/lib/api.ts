import { createLogger } from "./logger";

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";

const log = createLogger("api");

export interface ApiIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  issues?: ApiIssue[];

  constructor(message: string, status: number, issues?: ApiIssue[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    accessToken = data.accessToken;
    return accessToken;
  } catch (err) {
    log.error("session refresh request failed", err);
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, allowRetry = true): Promise<T> {
  const method = options.method ?? "GET";
  log.debug(`${method} ${path}`, options.body ? JSON.parse(options.body as string) : undefined);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    log.error(`${method} ${path} network error`, err);
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (res.status === 401 && allowRetry && path !== "/auth/refresh") {
    log.warn("access token rejected, attempting silent refresh", { path });
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, options, false);
    unauthorizedHandler?.();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string; issues?: ApiIssue[] });
    log.error(`${method} ${path} failed`, { status: res.status, body });
    throw new ApiError(body.error ?? "Something went wrong. Please try again.", res.status, body.issues);
  }

  if (res.status === 204) return undefined as T;

  const data = (await res.json()) as T;
  log.debug(`${method} ${path} succeeded`, data);
  return data;
}

export async function uploadImage(file: File, allowRetry = true): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/uploads/image`, {
      method: "POST",
      credentials: "include",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
  } catch (err) {
    log.error("image upload network error", err);
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (res.status === 401 && allowRetry) {
    log.warn("access token rejected on upload, attempting silent refresh");
    const refreshed = await refreshAccessToken();
    if (refreshed) return uploadImage(file, false);
    unauthorizedHandler?.();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    log.error("image upload failed", { status: res.status, body });
    throw new ApiError(body.error ?? "Could not upload image", res.status);
  }

  return (await res.json()) as { url: string };
}
