"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import {
  GoogleButton,
  OrDivider,
  PasswordField,
  TextField,
} from "@/components/auth/AuthFields";
import FormMessage from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import { clearBearerTokenCache } from "@/lib/api-client";
import { authHref, safeReturnPath } from "@/lib/safe-return";
import {
  authClient,
  friendlyAuthError,
  getPostAuthHref,
  resolveServerRole,
  signInWithGoogle,
  validateEmail,
  validatePassword,
} from "@/lib/auth-client";

export default function SignInForm({ initialError = "", returnTo = "" }) {
  const router = useRouter();
  const returnPath = safeReturnPath(returnTo, "");
  const fieldId = useId();
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(initialError);
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("idle");
  const busy = status === "email" || status === "google";

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const nextErrors = {
      email: validateEmail(values.email),
      password: validatePassword(values.password, { required: true }),
    };

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setStatus("email");
    clearBearerTokenCache();

    try {
      const result = await authClient.signIn.email({
        email: values.email.trim(),
        password: values.password,
      });

      if (result?.error) {
        setFormError(friendlyAuthError(result.error, "We couldn't sign you in."));
        return;
      }

      const role = await resolveServerRole(result);
      const destination = returnPath || getPostAuthHref(role);
      setSuccess(
        returnPath
          ? "Signed in successfully. Taking you back..."
          : "Signed in successfully. Taking you to your dashboard...",
      );
      router.replace(destination);
    } catch (error) {
      setFormError(friendlyAuthError(error, "We couldn't sign you in."));
    } finally {
      setStatus("idle");
    }
  }

  async function handleGoogle() {
    if (busy) {
      return;
    }

    setFormError("");
    setSuccess("");
    setStatus("google");

    try {
      const result = await signInWithGoogle({
        callbackURL: returnPath || "/dashboard",
        errorPath: authHref("/sign-in", {
          returnTo: returnPath,
          error: "google",
        }),
      });

      if (result?.error) {
        setFormError(
          friendlyAuthError(result.error, "Google sign-in could not be started."),
        );
      }
    } catch (error) {
      setFormError(
        friendlyAuthError(error, "Google sign-in could not be started."),
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl text-charcoal">Welcome back</h2>
        <p className="text-sm text-ink-muted">
          Sign in to continue to PizzaHub.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <FormMessage>{formError}</FormMessage>
        <FormMessage tone="success">{success}</FormMessage>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-busy={busy} className="mt-6">
        <div className="space-y-5">
          <TextField
            id={emailId}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={errors.email}
            disabled={busy}
          />

          <PasswordField
            id={passwordId}
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            error={errors.password}
            disabled={busy}
          />
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="mt-6 h-11 w-full bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
        >
          {status === "email" ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <OrDivider />

      <GoogleButton onClick={handleGoogle} disabled={busy}>
        {status === "google" ? "Opening Google..." : "Continue with Google"}
      </GoogleButton>
    </>
  );
}
