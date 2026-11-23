import { createAuthClient } from "better-auth/react";

/**
 * Better Auth is mounted by the backend at `/api/auth/*`. The same-origin
 * rewrite in next.config.mjs forwards that path to the backend, so the client
 * needs no public backend URL and no credential here.
 */
export const authClient = createAuthClient({
  fetchOptions: { credentials: "include" },
});

export const ACCOUNT_ROLES = Object.freeze({
  CUSTOMER: "customer",
  VENDOR: "vendor",
});

export const ROLE_LABELS = Object.freeze({
  [ACCOUNT_ROLES.CUSTOMER]: "Customer",
  [ACCOUNT_ROLES.VENDOR]: "Vendor",
});

/**
 * Role-specific dashboards are not part of this milestone. Keep the mapping
 * explicit so navigation can use it as soon as those pages exist. A `null`
 * route means "do not render a Dashboard link yet" rather than faking one.
 */
const DASHBOARD_ROUTES = Object.freeze({
  [ACCOUNT_ROLES.CUSTOMER]: null,
  [ACCOUNT_ROLES.VENDOR]: null,
});

export function normalizeAccountRole(value) {
  return value === ACCOUNT_ROLES.CUSTOMER || value === ACCOUNT_ROLES.VENDOR
    ? value
    : null;
}

/** Roles are accepted only from Better Auth's server response. */
export function getSessionAccountRole(session) {
  return normalizeAccountRole(session?.user?.role);
}

export function getAuthResultRole(result) {
  return normalizeAccountRole(result?.data?.user?.role);
}

export function resolveAuthenticatedRole(session, result) {
  return getSessionAccountRole(session) ?? getAuthResultRole(result);
}

/** Returns null while a role-specific dashboard has not been implemented. */
export function getDashboardHref(role) {
  return DASHBOARD_ROUTES[normalizeAccountRole(role)] ?? null;
}

/** Safe destination after a successful sign-in or sign-up. */
export function getPostAuthHref(role) {
  return getDashboardHref(role) ?? "/menu";
}

/**
 * Confirm the role from a fresh server session call after authentication. The
 * sign-in/sign-up response is kept only as a fallback for that first moment.
 */
export async function resolveServerRole(result) {
  try {
    const sessionResult = await authClient.getSession();
    return resolveAuthenticatedRole(sessionResult?.data ?? null, result);
  } catch {
    return getAuthResultRole(result);
  }
}

export function validateName(value) {
  const name = value.trim();

  if (!name) {
    return "Full name is required.";
  }

  if (name.length > 120) {
    return "Full name must be at most 120 characters.";
  }

  return "";
}

export function validateEmail(value) {
  const email = value.trim();

  if (!email) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

/**
 * Registration demands the backend's password rules; sign-in only needs a
 * value so the server can judge whether the credentials are correct.
 */
export function validatePassword(value, { required = true, enforceRules = false } = {}) {
  if (!value) {
    return required ? "Password is required." : "";
  }

  if (!enforceRules) {
    return "";
  }

  if (value.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (value.length > 128) {
    return "Password must be at most 128 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include an uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include a lowercase letter.";
  }

  return "";
}

export function isValidImageUrl(value) {
  const image = value.trim();

  if (!image) {
    return true;
  }

  try {
    return ["http:", "https:"].includes(new URL(image).protocol);
  } catch {
    return false;
  }
}

export function authErrorMessage(error, fallback) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  return message || fallback;
}

/** Translate known backend/auth failures into beginner-friendly messages. */
export function friendlyAuthError(error, fallback) {
  const message = authErrorMessage(error, fallback);

  if (/provider not found/i.test(message)) {
    return "Google sign-in is not configured yet. Please use email and password.";
  }

  if (/already exists|already registered|email.*taken/i.test(message)) {
    return "An account with that email already exists. Try signing in instead.";
  }

  if (/invalid.*(email|password)|incorrect.*(email|password)/i.test(message)) {
    return "That email or password is incorrect.";
  }

  if (/user not found/i.test(message)) {
    return "We couldn't find an account with that email.";
  }

  return message;
}

export function signInWithGoogle({ errorPath = "/sign-in", additionalData } = {}) {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/menu",
    newUserCallbackURL: "/menu?welcome=1",
    errorCallbackURL: errorPath,
    ...(additionalData ? { additionalData } : {}),
  });
}
