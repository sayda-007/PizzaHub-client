"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ACCOUNT_ROLES, ROLE_LABELS } from "@/lib/auth-client";

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted transition-colors focus-visible:border-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25";

function FieldError({ id, children }) {
  if (!children) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 text-xs text-destructive">
      {children}
    </p>
  );
}

export function TextField({ id, label, error, hint, ...inputProps }) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${controlClass} ${error ? "border-destructive" : ""}`}
        {...inputProps}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export function PasswordField({ id, label, error, hint, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${controlClass} mt-0 pr-12 ${error ? "border-destructive" : ""}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-ink-muted transition-colors hover:text-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

const ROLE_OPTIONS = Object.freeze([
  {
    value: ACCOUNT_ROLES.CUSTOMER,
    description: "For people ordering from local PizzaHub kitchens.",
  },
  {
    value: ACCOUNT_ROLES.VENDOR,
    description: "For restaurant owners and kitchen teams.",
  },
]);

export function RolePicker({ value, onChange, error, name = "role" }) {
  const generatedId = useId();
  const errorId = `${generatedId}-role-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className={labelClass}>Account type</legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {ROLE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-sm border p-4 transition-colors ${
                selected
                  ? "border-tomato bg-tomato/5"
                  : "border-line bg-paper hover:border-orange/60"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4 accent-tomato"
              />
              <span>
                <span className="block text-sm font-semibold text-charcoal">
                  {ROLE_LABELS[option.value]}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.34-.18-1.96H12v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.28Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.89a6 6 0 0 1 0-3.78v-2.6H3.07a10 10 0 0 0 0 8.98l3.34-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.51l3.34 2.6C7.2 7.75 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}

export function GoogleButton({ onClick, disabled, children = "Continue with Google" }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-11 w-full border-line bg-paper text-charcoal hover:bg-muted hover:text-charcoal"
    >
      <GoogleIcon />
      {children}
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">
        or
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
