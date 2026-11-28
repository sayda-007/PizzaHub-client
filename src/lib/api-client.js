import { authClient } from "@/lib/auth-client";

/**
 * Thin fetch wrapper for the JWT-protected backend APIs.
 *
 * Every path is same-origin and goes through the Next.js `/api/:path*` rewrite.
 * The JWT is minted by Better Auth and cached until it nears expiry, so normal
 * dashboard usage does not spend the shared API rate-limit budget on token
 * requests. Roles, ownership and business rules are always decided by the
 * server, never by these helpers.
 */
export class ApiClientError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiClientError";
    this.code = details.code ?? "";
    this.status = details.status ?? null;
    this.details = details.details ?? null;
  }
}

function responseMessage(payload, status) {
  const message =
    typeof payload?.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : "";

  if (message) {
    return message;
  }

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to do that.";
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status === 503) {
    return "This service is not configured on this deployment yet.";
  }

  return "The request could not be completed. Please try again.";
}

let cachedToken = "";
let cachedTokenExpiresAt = 0;
let pendingTokenRequest = null;
let cacheGeneration = 0;

const TOKEN_EXPIRY_SKEW_MS = 60_000;

/** Read `exp` without verifying it; the backend performs real verification. */
function jwtExpiresAt(token) {
  const parts = token.split(".");

  if (parts.length !== 3 || typeof atob !== "function") {
    return 0;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload?.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** Call after sign-in, sign-up or sign-out so one account's token is never reused. */
export function clearBearerTokenCache() {
  cacheGeneration += 1;
  cachedToken = "";
  cachedTokenExpiresAt = 0;
  pendingTokenRequest = null;
}

function sessionTokenError(error) {
  const status = Number(error?.status) || 401;
  const code = typeof error?.code === "string" ? error.code : "";

  if (status === 429) {
    return new ApiClientError("Too many requests. Please wait a moment and try again.", {
      status,
      code: code || "RATE_LIMITED",
    });
  }

  return new ApiClientError("We couldn't verify your session. Please sign in again.", {
    status,
    code,
  });
}

/**
 * Return a usable JWT, sharing one in-flight request across simultaneous
 * callers and caching the result until shortly before its expiry.
 */
export async function getBearerToken({ forceRefresh = false } = {}) {
  const now = Date.now();

  if (!forceRefresh && cachedToken && now + TOKEN_EXPIRY_SKEW_MS < cachedTokenExpiresAt) {
    return cachedToken;
  }

  if (pendingTokenRequest) {
    return pendingTokenRequest;
  }

  const generation = cacheGeneration;

  pendingTokenRequest = (async () => {
    let result;

    try {
      result = await authClient.token();
    } catch (error) {
      throw sessionTokenError(error);
    }

    if (result?.error) {
      throw sessionTokenError(result.error);
    }

    const token = result?.data?.token;

    if (typeof token !== "string" || !token) {
      throw sessionTokenError(null);
    }

    const expiresAt = jwtExpiresAt(token);

    if (generation === cacheGeneration && expiresAt > Date.now()) {
      cachedToken = token;
      cachedTokenExpiresAt = expiresAt;
    }

    return token;
  })();

  try {
    return await pendingTokenRequest;
  } finally {
    if (generation === cacheGeneration) {
      pendingTokenRequest = null;
    }
  }
}

function requireApiPath(path) {
  if (typeof path !== "string" || !path.startsWith("/api/") || path.startsWith("//")) {
    throw new ApiClientError("Invalid API path.");
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * @param {string} path Same-origin API path beginning with `/api/`.
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal, authenticated?: boolean }} options
 */
export async function apiRequest(path, options = {}) {
  requireApiPath(path);

  const {
    method = "GET",
    body,
    signal,
    authenticated = true,
  } = options;
  const headers = { Accept: "application/json" };

  if (authenticated) {
    headers.Authorization = `Bearer ${await getBearerToken()}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      ...(signal ? { signal } : {}),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiClientError("We couldn't reach PizzaHub. Please try again.");
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearBearerTokenCache();
    }

    throw new ApiClientError(responseMessage(payload, response.status), {
      code: payload?.code,
      status: response.status,
      details: payload?.details,
    });
  }

  return payload;
}

/** Multipart upload for vendor menu images; the browser sets the boundary. */
export async function apiUpload(path, formData, options = {}) {
  requireApiPath(path);
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${await getBearerToken()}`,
  };

  let response;

  try {
    response = await fetch(path, {
      method: options.method ?? "POST",
      headers,
      credentials: "include",
      cache: "no-store",
      body: formData,
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiClientError("We couldn't reach PizzaHub. Please try again.");
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearBearerTokenCache();
    }

    throw new ApiClientError(responseMessage(payload, response.status), {
      code: payload?.code,
      status: response.status,
      details: payload?.details,
    });
  }

  return payload;
}

export function friendlyApiError(error, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
}
