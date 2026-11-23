"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, LogOut, Menu, UserRound, X } from "lucide-react";

import AccountMenu, { AccountIdentity } from "@/components/layout/AccountMenu";
import BrandLogo from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import {
  authClient,
  getDashboardHref,
  getSessionAccountRole,
} from "@/lib/auth-client";
import { authHref } from "@/lib/safe-return";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Browse Menu", href: "/menu" },
];

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const role = getSessionAccountRole(session);
  const dashboardHref = getDashboardHref(role);
  const links = dashboardHref
    ? [...navigation, { label: "Dashboard", href: dashboardHref }]
    : navigation;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError("");

    try {
      const result = await authClient.signOut();

      if (result?.error) {
        setLogoutError("We couldn't sign you out. Please try again.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setLogoutError("We couldn't sign you out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="PizzaHub home"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-sm"
        >
          <BrandLogo />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-ink-muted transition-colors hover:text-tomato"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          {isPending ? (
            <SessionPlaceholder />
          ) : session?.user ? (
            <AccountMenu
              session={session}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              logoutError={logoutError}
            />
          ) : (
            <Suspense fallback={<SignedOutActions />}>
              <ReturnAwareSignedOutActions />
            </Suspense>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm border border-line px-3 text-sm font-medium text-charcoal md:hidden"
        >
          {open ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
          <span>Menu</span>
        </button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile"
        hidden={!open}
        className="border-t border-line bg-paper md:hidden"
      >
        <ul className="mx-auto flex w-full max-w-7xl flex-col px-5 py-2 sm:px-8">
          {links.map((item) => (
            <li key={item.label} className="border-b border-line">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-base font-medium text-charcoal hover:text-tomato"
              >
                {item.label}
              </Link>
            </li>
          ))}

          {isPending ? (
            <li className="py-4">
              <SessionPlaceholder />
            </li>
          ) : session?.user ? (
            <MobileAccount
              session={session}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              logoutError={logoutError}
            />
          ) : (
            <li className="py-4">
              <Suspense
                fallback={<SignedOutActions mobile onNavigate={() => setOpen(false)} />}
              >
                <ReturnAwareSignedOutActions mobile onNavigate={() => setOpen(false)} />
              </Suspense>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

function ReturnAwareSignedOutActions({ mobile = false, onNavigate }) {
  const pathname = usePathname();
  const returnTo = pathname && !pathname.startsWith("/sign-") ? pathname : "";

  return (
    <SignedOutActions mobile={mobile} onNavigate={onNavigate} returnTo={returnTo} />
  );
}

function SignedOutActions({ mobile = false, onNavigate, returnTo = "" }) {
  const signInHref = authHref("/sign-in", { returnTo });
  const signUpHref = authHref("/sign-up", { returnTo });

  if (mobile) {
    return (
      <div className="grid gap-3">
        <Button
          asChild
          variant="outline"
          className="h-11 w-full border-line bg-paper text-charcoal hover:bg-muted hover:text-charcoal"
        >
          <Link href={signInHref} onClick={onNavigate}>
            Sign In
          </Link>
        </Button>
        <Button
          asChild
          className="h-11 w-full bg-tomato text-paper hover:bg-tomato-deep hover:text-paper"
        >
          <Link href={signUpHref} onClick={onNavigate}>
            Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" className="text-charcoal hover:text-tomato">
        <Link href={signInHref}>Sign In</Link>
      </Button>
      <Button
        asChild
        className="bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
      >
        <Link href={signUpHref}>Sign Up</Link>
      </Button>
    </div>
  );
}

function MobileAccount({ session, onLogout, loggingOut, logoutError }) {
  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tomato/10 text-tomato">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <AccountIdentity session={session} />

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-left text-sm font-medium text-charcoal hover:border-tomato/40 hover:text-tomato disabled:opacity-60"
            >
              {loggingOut ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <LogOut aria-hidden="true" className="size-4" />
              )}
              {loggingOut ? "Signing out..." : "Log out"}
            </button>
            {logoutError ? (
              <p role="alert" className="text-xs text-destructive">
                {logoutError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function SessionPlaceholder() {
  return (
    <div className="h-10 w-32 animate-pulse rounded-sm border border-line bg-muted">
      <span className="sr-only">Checking account...</span>
    </div>
  );
}
