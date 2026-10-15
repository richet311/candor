import { createLogger } from "./logger";
import { setApiStatus } from "./apiStatus";
import type { User } from "./types";

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";

const log = createLogger("api");

// The API runs on a free-tier host that sleeps after 15 idle minutes and takes up to about a
// minute to wake. Until it's up, requests hang or fail at the host's proxy (a 502-504, or an error
// page without CORS headers, which the browser reports as a network error) without ever reaching
// the app, so a request that fails that way is worth retrying instead of reporting right away.
const WAKE_STATUSES = new Set([502, 503, 504]);
const WAKE_WINDOW_MS = 90_000;
// A request still unanswered after this long is treated as waiting on a wake-up.
const SLOW_REQUEST_MS = 4_000;

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

export interface RefreshedSession {
  user: User;
  accessToken: string;
}

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let refreshInFlight: Promise<RefreshedSession | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// fetch(), except that with retryWhileWaking set, a request the API never got to answer is
// retried with backoff until WAKE_WINDOW_MS runs out, rather than failing on the first attempt
// against a sleeping server. Only set it for requests that are safe to send more than once.
async function fetchThroughWake(url: string, init: RequestInit, retryWhileWaking: boolean): Promise<Response> {
  const startedAt = Date.now();
  const slowTimer = retryWhileWaking ? setTimeout(() => setApiStatus("waking"), SLOW_REQUEST_MS) : undefined;

  try {
    for (let attempt = 0; ; attempt++) {
      let res: Response | null = null;
      let networkError: unknown = null;
      try {
        res = await fetch(url, init);
      } catch (err) {
        networkError = err;
      }

      if (res && !WAKE_STATUSES.has(res.status)) {
        setApiStatus("ok");
        return res;
      }
      if (!retryWhileWaking) {
        if (res) return res;
        throw networkError;
      }
      if (Date.now() - startedAt >= WAKE_WINDOW_MS) {
        setApiStatus("unreachable");
        if (res) return res;
        throw networkError;
      }

      setApiStatus("waking");
      log.debug(`no answer from the API yet (attempt ${attempt + 1}), retrying`, { url, status: res?.status });
      await sleep(Math.min(1000 * 2 ** attempt, 3000));
    }
  } finally {
    clearTimeout(slowTimer);
  }
}

// Trades the httpOnly refresh cookie for a new access token plus the user it belongs to, or null
// when there's no session. Concurrent callers share one request: the server rotates the refresh
// token on every use and treats the old one coming back as token theft, revoking every session
// the user has, so two refreshes racing on the same cookie (several requests hitting a 401 at
// once, or StrictMode running the session-restore effect twice) would sign them out everywhere.
export function refreshSession(): Promise<RefreshedSession | null> {
  refreshInFlight ??= requestRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function requestRefresh(): Promise<RefreshedSession | null> {
  try {
    // Retrying through a wake-up is safe despite the rotation: a request the app never received
    // rotated nothing, and if the app did rotate it but the reply never arrived, the browser still
    // holds the old cookie, so that session is lost with or without a retry.
    const res = await fetchThroughWake(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" }, true);
    if (!res.ok) return null;
    const data = (await res.json()) as RefreshedSession;
    accessToken = data.accessToken;
    return data;
  } catch (err) {
    log.error("session refresh request failed", err);
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, allowRetry = true): Promise<T> {
  const method = options.method ?? "GET";
  log.debug(`${method} ${path}`, options.body ? JSON.parse(options.body as string) : undefined);

  const tokenSent = accessToken;
  let res: Response;
  try {
    res = await fetchThroughWake(
      `${API_BASE}${path}`,
      {
        ...options,
        credentials: "include",
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers,
        },
      },
      // GETs only: resending anything else could apply it twice (a second checkout session, a
      // second expense) if the first attempt reached the app after all.
      method === "GET",
    );
  } catch (err) {
    log.error(`${method} ${path} network error`, err);
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  // A 401 on /auth/refresh itself means the session is genuinely gone, retrying it by calling
  // refresh again would just be asking the same failed thing to fix itself.
  if (res.status === 401 && allowRetry && path !== "/auth/refresh") {
    // Parallel requests don't all get their 401 back at once, so another one may have already
    // refreshed while this was in flight. Its token is the one to retry with, not a second rotation.
    if (accessToken && accessToken !== tokenSent) return apiFetch<T>(path, options, false);
    log.warn("access token rejected, attempting silent refresh", { path });
    const refreshed = await refreshSession();
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
    const refreshed = await refreshSession();
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
