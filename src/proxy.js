import { NextResponse } from "next/server";

import { hasSessionCookie } from "./lib/proxy-cookies.js";

/**
 * Lightweight guard for direct navigation to protected pages.
 *
 * This is intentionally only a cookie-presence check. Better Auth validates the
 * real session in the client gate, and every protected API also verifies the
 * JWT plus the live server-side session. A missing cookie gets an early, clean
 * redirect instead of rendering a protected shell for a signed-out visitor.
 */
export function proxy(request) {
  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("returnTo", `${pathname}${search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/subscription/:path*",
  ],
};
