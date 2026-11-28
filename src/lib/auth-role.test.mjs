import assert from "node:assert/strict";
import { test } from "node:test";

import {
  authClientBaseURL,
  resolveRoleFromSessionResult,
  sessionVerificationFailure,
} from "./auth-role.js";

test("a fresh server session resolves the vendor role", () => {
  const role = resolveRoleFromSessionResult(
    { data: { user: { role: "vendor" } }, error: null },
    { data: { user: { role: "customer" } } },
  );

  assert.equal(role, "vendor");
});

test("a missing role in the session falls back to the credential response", () => {
  const role = resolveRoleFromSessionResult(
    { data: { user: { role: null } }, error: null },
    { data: { user: { role: "vendor" } } },
  );

  assert.equal(role, "vendor");
});

test("a Better Auth error response is surfaced instead of being swallowed", () => {
  assert.throws(
    () =>
      resolveRoleFromSessionResult(
        { data: null, error: { status: 429, message: "Too many requests" } },
        { data: { user: { role: "vendor" } } },
      ),
    (error) => {
      assert.equal(error.message, "Too many requests");
      assert.equal(error.status, 429);
      return true;
    },
  );
});

test("a missing session after sign-in is a verification failure", () => {
  const failure = sessionVerificationFailure({ data: null, error: null });

  assert.match(failure.message, /couldn't verify your session/i);
  assert.throws(
    () =>
      resolveRoleFromSessionResult(
        { data: null, error: null },
        { data: { user: { role: "vendor" } } },
      ),
    /couldn't verify your session/i,
  );
});

test("the auth client base URL follows the live origin, not public env values", () => {
  const original = process.env.NEXT_PUBLIC_AUTH_URL;
  process.env.NEXT_PUBLIC_AUTH_URL = "https://wrong.example/api/auth";

  try {
    assert.equal(
      authClientBaseURL({ origin: "http://127.0.0.1:3000/" }),
      "http://127.0.0.1:3000/api/auth",
    );
    assert.equal(authClientBaseURL(null), undefined);
  } finally {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_AUTH_URL;
    } else {
      process.env.NEXT_PUBLIC_AUTH_URL = original;
    }
  }
});
