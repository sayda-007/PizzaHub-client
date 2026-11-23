"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, LogOut, UserRound } from "lucide-react";

import { ROLE_LABELS, getSessionAccountRole } from "@/lib/auth-client";

export function AccountIdentity({ session }) {
  const user = session?.user;
  const role = getSessionAccountRole(session);
  const displayName = user?.name?.trim() || "PizzaHub account";

  return (
    <div>
      <p className="truncate text-sm font-semibold text-charcoal">{displayName}</p>
      {user?.email ? (
        <p className="truncate text-xs text-ink-muted">{user.email}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {role ? (
          <span className="rounded-full bg-tomato/10 px-2 py-0.5 text-[0.7rem] font-semibold text-tomato">
            {ROLE_LABELS[role]}
          </span>
        ) : null}
        {user?.businessName ? (
          <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-ink-muted">
            {user.businessName}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function AccountMenu({ session, onLogout, loggingOut, logoutError }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const user = session?.user;
  const displayName = user?.name?.trim() || "PizzaHub account";

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleLogoutClick() {
    // Keep the menu open while the request runs. A failed logout leaves it
    // open so the error is visible; a successful session update unmounts it.
    onLogout();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="desktop-account-menu"
        aria-label={`Account menu for ${displayName}`}
        className={[
          "inline-flex h-10 items-center gap-2 rounded-sm border border-line bg-paper px-2.5 text-sm font-medium text-charcoal",
          "transition-colors hover:border-tomato/40 hover:text-tomato",
        ].join(" ")}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-tomato/10 text-tomato">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
        <span className="hidden max-w-28 truncate lg:block">{displayName}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          id="desktop-account-menu"
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-sm border border-line bg-surface shadow-[0_18px_45px_rgba(41,37,31,0.14)]"
        >
          <div className="border-b border-line px-4 py-3">
            <AccountIdentity session={session} />
          </div>

          {logoutError ? (
            <p role="alert" className="border-b border-line px-4 py-2 text-xs text-destructive">
              {logoutError}
            </p>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={handleLogoutClick}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-left text-sm font-medium text-charcoal transition-colors hover:bg-muted hover:text-tomato disabled:opacity-60"
          >
            {loggingOut ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <LogOut aria-hidden="true" className="size-4" />
            )}
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
