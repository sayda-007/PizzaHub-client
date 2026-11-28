/**
 * Pure helpers shared by the Better Auth client and its Node regression tests.
 *
 * Nothing in this module imports React, Better Auth or Next.js. Keeping these
 * decisions pure lets the sign-in/session failure paths be tested without a
 * browser while the real client remains responsible only for transport.
 */

export const ACCOUNT_ROLES = Object.freeze({
  CUSTOMER: "customer",
  VENDOR: "vendor",
  ADMIN: "admin",
});

const SESSION_VERIFICATION_MESSAGE =
  "We couldn't verify your session. Please try again.";

export function normalizeAccountRole(value) {
  return Object.values(ACCOUNT_ROLES).includes(value) ? value : null;
}

/** Roles are accepted only from Better Auth's server response. */
export function getSessionAccountRole(session) {
  return normalizeAccountRole(session?.user?.role);
}

export function getAuthResultRole(result) {
  return normalizeAccountRole(result?.data?.user?.role);
}

/** The fresh session is authoritative; the sign-in response is a first-use fallback. */
export function resolveAuthenticatedRole(session, result) {
  return getSessionAccountRole(session) ?? getAuthResultRole(result);
}

function toVerificationError(failure) {
  if (failure instanceof Error) {
    return failure;
  }

  const message =
    typeof failure?.message === "string" && failure.message.trim()
      ? failure.message.trim()
      : SESSION_VERIFICATION_MESSAGE;

  const error = new Error(message);

  if (typeof failure?.status === "number") {
    error.status = failure.status;
  }

  return error;
}

/**
 * A successful credential response is not enough: the browser must also have a
 * usable session cookie. Better Auth reports failures through `error` rather
 * than by throwing, so both shapes are treated as verification failures.
 */
export function sessionVerificationFailure(sessionResult) {
  if (sessionResult?.error) {
    return toVerificationError(sessionResult.error);
  }

  if (!sessionResult?.data?.user) {
    return toVerificationError(null);
  }

  return null;
}

export function resolveRoleFromSessionResult(sessionResult, result) {
  const failure = sessionVerificationFailure(sessionResult);

  if (failure) {
    throw failure;
  }

  return resolveAuthenticatedRole(sessionResult.data, result);
}

/**
 * Pin Better Auth to the same-origin Next.js rewrite. Better Auth requires an
 * absolute base URL, so a relative "/api/auth" would be rejected; deriving it
 * from the live browser origin also prevents a stray public auth env variable
 * from silently bypassing the rewrite.
 */
export function authClientBaseURL(location) {
  if (typeof location?.origin !== "string" || !location.origin) {
    return undefined;
  }

  return `${location.origin.replace(/\/+$/, "")}/api/auth`;
}
