import assert from "node:assert/strict";
import { test } from "node:test";

import { hasSessionCookie } from "./proxy-cookies.js";

const requestWith = (names) => ({
  cookies: {
    getAll: () => names.map((name) => ({ name, value: "test-only" })),
  },
});

test("recognizes development and secure production session cookie names", () => {
  const variants = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "better-auth-session_token",
    "__Secure-better-auth-session_token",
    "better-auth.session_data",
    "__Secure-better-auth.session_data",
  ];

  for (const name of variants) {
    assert.equal(hasSessionCookie(requestWith([name])), true, name);
  }
});

test("recognizes chunked Better Auth cookie cache names", () => {
  const variants = [
    "better-auth.session_data.0",
    "better-auth.session_data.12",
    "__Secure-better-auth.session_data.0",
    "__Secure-better-auth.session_token.1",
  ];

  for (const name of variants) {
    assert.equal(hasSessionCookie(requestWith([name])), true, name);
  }
});

test("ignores unrelated cookies and non-numeric cookie suffixes", () => {
  const variants = [
    "theme",
    "better-auth.account_data",
    "better-auth.session_token.preview",
    "__Secure-better-auth.session_data.preview",
  ];

  for (const name of variants) {
    assert.equal(hasSessionCookie(requestWith([name])), false, name);
  }

  assert.equal(hasSessionCookie(requestWith([])), false);
});
