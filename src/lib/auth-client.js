import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

import {
  ACCOUNT_ROLES,
  authClientBaseURL,
  getSessionAccountRole,
  normalizeAccountRole,
  resolveRoleFromSessionResult,
} from "@/lib/auth-role";
import { safeReturnPath } from "@/lib/safe-return";

export {
  ACCOUNT_ROLES,
  getAuthResultRole,
  getSessionAccountRole,
  normalizeAccountRole,
  resolveAuthenticatedRole,
} from "@/lib/auth-role";

/**
 * Better Auth is mounted by the backend at `/api/auth/*`. The same-origin
 * rewrite in next.config.mjs forwards that path to the backend, so the client
 * needs no public backend URL and no credential here. Pinning the browser base
 * URL to the live origin prevents a stray public auth env value from bypassing
 * that rewrite. The JWT plugin exposes `authClient.token()` for the order API.
 */
export const authClient = createAuthClient({
  baseURL: authClientBaseURL(
    typeof window === "undefined" ? null : window.location,
  ),
  plugins: [jwtClient()],
  fetchOptions: { credentials: "include" },
});

export const ROLE_LABELS = Object.freeze({
  [ACCOUNT_ROLES.CUSTOMER]: "Customer",
  [ACCOUNT_ROLES.VENDOR]: "Vendor",
  [ACCOUNT_ROLES.ADMIN]: "Admin",
});

/** Each role has one real destination; the backend remains the role authority. */
const DASHBOARD_ROUTES = Object.freeze({
  [ACCOUNT_ROLES.CUSTOMER]: "/orders",
  [ACCOUNT_ROLES.VENDOR]: "/vendor",
  [ACCOUNT_ROLES.ADMIN]: "/admin",
});

/** Ordering UI is limited to the customer role; the backend still enforces it. */
export function canPlaceCustomerOrder(session) {
  return getSessionAccountRole(session) === ACCOUNT_ROLES.CUSTOMER;
}

/**
 * Normalize Better Auth's session hook. Components must distinguish a real
 * signed-out state from a failed session request instead of treating both as
 * "not signed in".
 */
export function useAuthSession() {
  const { data, error, isPending, isRefetching, refetch } = authClient.useSession();

  return {
    session: data ?? null,
    sessionError: error ?? null,
    isPending,
    isRefetching,
    refetch,
  };
}

export function sessionErrorMessage(error) {
  if (Number(error?.status) === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return "We couldn't check your session. Please refresh and try again.";
}

/**
 * Gate for protected data effects. A component may only call a protected API
 * after the session request has finished and its DB-backed role is allowed.
 * Passing no roles means any signed-in account is enough.
 */
export function useAuthorizedSession(allowedRoles) {
  const { session, sessionError, isPending, isRefetching, refetch } = useAuthSession();
  const role = getSessionAccountRole(session);
  const roles = Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : null;
  const hasRole = roles ? roles.includes(role) : Boolean(role);
  const canLoad = !isPending && !sessionError && Boolean(session?.user) && hasRole;

  return { session, role, sessionError, isPending, isRefetching, refetch, canLoad };
}

/** Returns the dashboard route for a known role, or null for unknown roles. */
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
  const sessionResult = await authClient.getSession();
  return resolveRoleFromSessionResult(sessionResult, result);
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

export function signInWithGoogle({
  callbackURL = "/dashboard",
  newUserCallbackURL = callbackURL,
  errorPath = "/sign-in",
  additionalData,
} = {}) {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: safeReturnPath(callbackURL),
    newUserCallbackURL: safeReturnPath(newUserCallbackURL),
    errorCallbackURL: safeReturnPath(errorPath, "/sign-in"),
    ...(additionalData ? { additionalData } : {}),
  });
}
