/**
 * Session cookie names emitted by Better Auth 1.7.27.
 *
 * The installed package builds `better-auth.session_token` and
 * `better-auth.session_data`, prefixes both with `__Secure-` when secure
 * cookies are enabled, and accepts `better-auth-session_token` as a legacy
 * separator in `getSessionCookie()`. Large cookie-cache values are chunked as
 * `<name>.0`, `<name>.1`, and so on.
 *
 * This is a presence check only. Cookie values are never read or logged here;
 * the real session is still validated by the client gate and protected APIs.
 */
const SESSION_COOKIE_BASES = Object.freeze([
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth-session_token",
  "__Secure-better-auth-session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
]);

function isSessionCookieName(name) {
  return SESSION_COOKIE_BASES.some((base) => {
    if (name === base) {
      return true;
    }

    if (!name.startsWith(`${base}.`)) {
      return false;
    }

    return /^\d+$/.test(name.slice(base.length + 1));
  });
}

export function hasSessionCookie(request) {
  return request.cookies.getAll().some(({ name }) => isSessionCookieName(name));
}
