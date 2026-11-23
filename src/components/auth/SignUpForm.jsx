"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import {
  GoogleButton,
  OrDivider,
  PasswordField,
  RolePicker,
  TextField,
} from "@/components/auth/AuthFields";
import FormMessage from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_ROLES,
  authClient,
  friendlyAuthError,
  getPostAuthHref,
  isValidImageUrl,
  resolveServerRole,
  signInWithGoogle,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth-client";

function registrationFieldErrors(error) {
  const message = typeof error?.message === "string" ? error.message : "";
  const fields = {};

  if (/email.*(already|exist|taken|registered)|account.*already/i.test(message)) {
    fields.email = "An account with that email already exists. Try signing in.";
  }

  if (/password/i.test(message) && /uppercase|lowercase|at least|characters|string/i.test(message)) {
    fields.password = message;
  }

  if (/name/i.test(message)) {
    fields.name = message;
  }

  if (/image/i.test(message)) {
    fields.image = message;
  }

  if (/role/i.test(message)) {
    fields.role = message;
  }

  return fields;
}

export default function SignUpForm({ initialError = "" }) {
  const router = useRouter();
  const fieldId = useId();
  const nameId = `${fieldId}-name`;
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;
  const imageId = `${fieldId}-image`;
  const redirectTimer = useRef(null);

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    image: "",
    role: ACCOUNT_ROLES.CUSTOMER,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(initialError);
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("idle");
  const busy = status !== "idle";

  useEffect(
    () => () => {
      if (redirectTimer.current) {
        window.clearTimeout(redirectTimer.current);
      }
    },
    [],
  );

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
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validatePassword(values.password, {
        required: true,
        enforceRules: true,
      }),
      image: isValidImageUrl(values.image) ? "" : "Enter a valid http or https image URL.",
    };

    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.image) {
      setErrors(nextErrors);
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setStatus("email");
    let succeeded = false;

    try {
      const image = values.image.trim();
      const result = await authClient.signUp.email({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        ...(image ? { image } : {}),
      });

      if (result?.error) {
        const serverFields = registrationFieldErrors(result.error);

        if (Object.keys(serverFields).length > 0) {
          setErrors((current) => ({ ...current, ...serverFields }));
        } else {
          setFormError(friendlyAuthError(result.error, "We couldn't create your account."));
        }
        return;
      }

      const role = await resolveServerRole(result);
      succeeded = true;
      setStatus("success");
      setSuccess("Account created successfully. Taking you to the menu...");
      redirectTimer.current = window.setTimeout(() => {
        router.replace(getPostAuthHref(role));
      }, 1000);
    } catch (error) {
      setFormError(friendlyAuthError(error, "We couldn't create your account."));
    } finally {
      if (!succeeded) {
        setStatus("idle");
      }
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
      // Google creates the account on the server. The public role is passed
      // through Better Auth's OAuth data; Admin is never an option here.
      const result = await signInWithGoogle({
        errorPath: "/sign-up?auth_error=google",
        additionalData: { role: values.role },
      });

      if (result?.error) {
        setFormError(
          friendlyAuthError(result.error, "Google sign-up could not be started."),
        );
      }
    } catch (error) {
      setFormError(
        friendlyAuthError(error, "Google sign-up could not be started."),
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl text-charcoal">Create your account</h2>
        <p className="text-sm text-ink-muted">
          Fill in your details to get started.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <FormMessage>{formError}</FormMessage>
        <FormMessage tone="success">{success}</FormMessage>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-busy={busy} className="mt-6">
        <div className="space-y-5">
          <TextField
            id={nameId}
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={errors.name}
            disabled={busy}
          />

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
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            error={errors.password}
            hint="Use at least 6 characters with one uppercase and one lowercase letter."
            disabled={busy}
          />

          <TextField
            id={imageId}
            label="Profile image (optional)"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com/photo.jpg"
            value={values.image}
            onChange={(event) => updateField("image", event.target.value)}
            error={errors.image}
            hint="Paste a public http or https image URL."
            disabled={busy}
          />

          <RolePicker
            value={values.role}
            onChange={(role) => updateField("role", role)}
            error={errors.role}
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
              Creating account...
            </>
          ) : status === "success" ? (
            "Account created"
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <OrDivider />

      <GoogleButton onClick={handleGoogle} disabled={busy}>
        {status === "google" ? "Opening Google..." : "Sign up with Google"}
      </GoogleButton>
    </>
  );
}
