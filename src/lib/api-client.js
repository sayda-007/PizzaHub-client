import { authClient } from "@/lib/auth-client";

/**
 * Thin fetch wrapper for the JWT-protected backend APIs.
 *
 * Every path is same-origin and goes through the Next.js `/api/:path*` rewrite.
 * The JWT comes from Better Auth on each call; roles, ownership and business
 * rules are always decided by the server, never by these helpers.
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

  if (status === 503) {
    return "This service is not configured on this deployment yet.";
  }

  return "The request could not be completed. Please try again.";
}

async function bearerToken() {
  let result;

  try {
    result = await authClient.token();
  } catch {
    throw new ApiClientError("We couldn't verify your session. Please sign in again.", {
      status: 401,
    });
  }

  const token = result?.data?.token;

  if (result?.error || typeof token !== "string" || !token) {
    throw new ApiClientError("We couldn't verify your session. Please sign in again.", {
      status: 401,
    });
  }

  return token;
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
    headers.Authorization = `Bearer ${await bearerToken()}`;
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
    Authorization: `Bearer ${await bearerToken()}`,
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
