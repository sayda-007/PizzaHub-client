"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ACCOUNT_ROLES,
  authClient,
  getDashboardHref,
  getSessionAccountRole,
} from "@/lib/auth-client";
import { authHref } from "@/lib/safe-return";

const NAVIGATION = Object.freeze({
  [ACCOUNT_ROLES.CUSTOMER]: [
    { label: "My orders", href: "/orders" },
    { label: "Profile", href: "/profile" },
  ],
  [ACCOUNT_ROLES.VENDOR]: [
    { label: "Overview", href: "/vendor" },
    { label: "Menu items", href: "/vendor/menu" },
    { label: "Orders", href: "/vendor/orders" },
    { label: "Subscription", href: "/vendor/subscription" },
    { label: "Profile", href: "/profile" },
  ],
  [ACCOUNT_ROLES.ADMIN]: [
    { label: "Overview", href: "/admin" },
    { label: "Menu moderation", href: "/admin/menu" },
    { label: "Users", href: "/admin/users" },
    { label: "Transactions", href: "/admin/transactions" },
    { label: "Profile", href: "/profile" },
  ],
});

function Gate({ title, description, children, actionHref, actionLabel }) {
  return (
    <main className="bg-paper">
      <div className="mx-auto w-full max-w-4xl px-5 py-20 sm:px-8">
        <div className="rounded-sm border border-line bg-surface p-8 text-center sm:p-12">
          <ShieldAlert aria-hidden="true" className="mx-auto size-9 text-tomato" />
          <h1 className="mt-5 font-heading text-3xl text-charcoal">{title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
          {actionHref && actionLabel ? (
            <Button
              asChild
              className="mt-6 h-11 bg-tomato px-5 text-paper hover:bg-tomato-deep hover:text-paper"
            >
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}

export default function DashboardShell({
  title,
  description,
  allowedRoles,
  actions,
  children,
}) {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const role = getSessionAccountRole(session);
  const isAllowed = allowedRoles?.length ? allowedRoles.includes(role) : Boolean(role);

  if (isPending) {
    return (
      <main className="bg-paper">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
          <div className="h-72 animate-pulse rounded-sm border border-line bg-muted" />
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <Gate
        title="Sign in to continue"
        description="This area belongs to your PizzaHub account. Sign in and we will take you back here."
        actionHref={authHref("/sign-in", { returnTo: pathname })}
        actionLabel="Sign in"
      />
    );
  }

  if (!isAllowed) {
    return (
      <Gate
        title="This page isn't for your account"
        description="Your account does not have access to this section. Use the link below to return to your own dashboard."
        actionHref={getDashboardHref(role) ?? "/menu"}
        actionLabel={role ? "Go to my dashboard" : "Browse the menu"}
      >
        <p className="mt-4 text-center text-xs text-ink-muted">
          Need a different account? Sign out from the account menu and sign in again.
        </p>
      </Gate>
    );
  }

  const links = NAVIGATION[role] ?? [];

  return (
    <main className="bg-paper">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside aria-label="Account navigation">
            <div className="rounded-sm border border-line bg-surface p-4 lg:sticky lg:top-24">
              <p className="px-2 pb-3 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                Your account
              </p>
              <nav>
                <ul className="space-y-1">
                  {links.map((link) => {
                    const current = pathname === link.href;
                    const exactHome =
                      link.href === "/orders" && pathname.startsWith("/orders/");

                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={current || exactHome ? "page" : undefined}
                          className={`flex items-center justify-between rounded-sm px-2.5 py-2 text-sm transition-colors ${
                            current || exactHome
                              ? "bg-tomato/10 font-semibold text-tomato"
                              : "text-ink-muted hover:bg-muted hover:text-charcoal"
                          }`}
                        >
                          {link.label}
                          {current || exactHome ? (
                            <ArrowRight aria-hidden="true" className="size-3.5" />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          <section className="min-w-0">
            <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">{title}</h1>
                {description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </header>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
