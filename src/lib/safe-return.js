const DEFAULT_RETURN_PATH = "/menu";
const RETURN_BASE = "https://pizzahub.invalid";

/**
 * Only same-origin paths can be used after sign-in. A value such as
 * `//example.com` or `https://example.com` must never become a redirect target.
 */
export function safeReturnPath(value, fallback = DEFAULT_RETURN_PATH) {
  if (typeof value !== "string") {
    return fallback;
  }

  const candidate = value.trim();

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    /[\\\u0000-\u001F\u007F]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, RETURN_BASE);

    if (parsed.origin !== RETURN_BASE) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function authHref(path, { returnTo, error } = {}) {
  const params = new URLSearchParams();

  const safeReturn = safeReturnPath(returnTo, "");

  if (safeReturn) {
    params.set("returnTo", safeReturn);
  }

  if (error) {
    params.set("auth_error", error);
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}
