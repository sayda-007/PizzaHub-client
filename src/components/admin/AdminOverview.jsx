"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES } from "@/lib/auth-client";
import { getAdminStats } from "@/lib/dashboard-client";

const STAT_CARDS = Object.freeze([
  { key: "totalUsers", label: "Total users" },
  { key: "totalVendors", label: "Vendors" },
  { key: "totalCustomers", label: "Customers" },
  { key: "totalMenuItems", label: "Menu items" },
  { key: "pendingMenuItems", label: "Pending review" },
  { key: "totalTransactions", label: "Transactions" },
]);

const QUICK_LINKS = Object.freeze([
  {
    href: "/admin/menu",
    title: "Menu moderation",
    description: "Review submitted items, decide on approval, and manage published availability.",
    action: "Open moderation queue",
  },
  {
    href: "/admin/users",
    title: "User directory",
    description: "Find accounts, inspect subscription details, and manage access with block controls.",
    action: "Browse users",
  },
  {
    href: "/admin/transactions",
    title: "Payment records",
    description: "Read Stripe-backed payment records and filter them by status, vendor, or date.",
    action: "View transactions",
  },
]);

function formatCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? count.toLocaleString("en-US") : "—";
}

function AdminOverviewContent() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    getAdminStats()
      .then((payload) => {
        if (!active) {
          return;
        }

        const nextStats = payload?.stats;

        if (!nextStats || typeof nextStats !== "object") {
          setStats(null);
          setError("The admin stats response was empty. Please try again.");
          return;
        }

        setStats(nextStats);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        setStats(null);
        setError(friendlyApiError(requestError, "We couldn't load the admin stats."));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <div className="space-y-10">
        {loading ? (
          <DashboardLoading label="Loading admin stats..." />
        ) : error ? (
          <DashboardError message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : (
          <>
            <section aria-labelledby="admin-stats-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2
                  id="admin-stats-heading"
                  className="font-heading text-xl text-charcoal sm:text-2xl"
                >
                  At a glance
                </h2>
                <p className="text-xs text-ink-muted">Current server-side totals</p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {STAT_CARDS.map((card) => (
                  <div
                    key={card.key}
                    className="rounded-sm border border-line bg-surface p-5"
                  >
                    <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                      {card.label}
                    </p>
                    <p className="mt-3 font-heading text-3xl text-charcoal">
                      {formatCount(stats?.[card.key])}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="admin-links-heading">
              <h2
                id="admin-links-heading"
                className="font-heading text-xl text-charcoal sm:text-2xl"
              >
                Manage PizzaHub
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex h-full flex-col rounded-sm border border-line bg-surface p-5 transition-colors hover:border-tomato/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/30"
                  >
                    <h3 className="font-heading text-lg text-charcoal">{link.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                      {link.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-tomato group-hover:text-tomato-deep">
                      {link.action}
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
    </div>
  );
}

export default function AdminOverview() {
  return (
    <DashboardShell
      title="Admin overview"
      description="Live counts from PizzaHub. These numbers come directly from the admin stats endpoint."
      allowedRoles={[ACCOUNT_ROLES.ADMIN]}
    >
      <AdminOverviewContent />
    </DashboardShell>
  );
}
