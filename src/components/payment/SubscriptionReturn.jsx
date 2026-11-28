"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Info, LoaderCircle, RotateCw } from "lucide-react";

import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { ACCOUNT_ROLES, useAuthorizedSession } from "@/lib/auth-client";
import { getSubscription } from "@/lib/dashboard-client";
import { formatDateTime } from "@/lib/format";

export default function SubscriptionReturn({ variant }) {
  const { canLoad } = useAuthorizedSession([ACCOUNT_ROLES.VENDOR]);
  const isSuccess = variant === "success";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getSubscription();
      setSubscription(result?.subscription ?? null);
    } catch (loadError) {
      setError(loadError?.message ?? "We couldn't read your subscription status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [canLoad, load]);

  return (
    <DashboardShell
      title={isSuccess ? "Checkout complete" : "Checkout canceled"}
      description={
        isSuccess
          ? "Thanks for completing Stripe checkout. We confirm Premium from the signed payment event."
          : "You stopped the checkout before completing payment. Your existing plan has not changed."
      }
      allowedRoles={[ACCOUNT_ROLES.VENDOR]}
      actions={
        <Button asChild variant="outline" className="border-line bg-paper text-charcoal">
          <Link href="/vendor/subscription">Subscription settings</Link>
        </Button>
      }
    >
      <div className="rounded-sm border border-line bg-surface p-5 sm:p-7">
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-olive" />
          ) : (
            <Info aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-tomato" />
          )}
          <div>
            <h2 className="font-heading text-xl text-charcoal">
              {isSuccess ? "Payment received by Stripe" : "No payment was completed"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {isSuccess
                ? "Stripe will notify PizzaHub securely. If Premium has not appeared yet, check again in a moment."
                : "You can return to your subscription page at any time and start a new checkout."}
            </p>
          </div>
        </div>

        {sessionId ? (
          <p className="mt-5 break-all rounded-sm border border-line bg-paper px-3 py-2 text-xs text-ink-muted">
            Checkout session: {sessionId}
          </p>
        ) : null}

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Current subscription
          </h3>

          <div className="mt-3">
            {loading ? (
              <DashboardLoading label="Checking subscription..." />
            ) : error ? (
              <DashboardError message={error} onRetry={load} />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge type="subscription" status={subscription?.status} />
                  <span className="text-sm font-medium text-charcoal">
                    {subscription?.plan ?? "—"} plan
                  </span>
                  {subscription?.isPremium ? (
                    <span className="text-sm font-semibold text-olive">Premium active</span>
                  ) : null}
                </div>
                {subscription?.expiresAt ? (
                  <p className="text-sm text-ink-muted">
                    {subscription.cancelAtPeriodEnd
                      ? "Ends"
                      : "Renews or expires"}{" "}
                    {formatDateTime(subscription.expiresAt)}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={load}
                  disabled={loading}
                  className="h-9 border-line bg-paper text-charcoal hover:bg-muted"
                >
                  <RotateCw aria-hidden="true" className={loading ? "animate-spin" : ""} />
                  Check again
                </Button>
              </div>
            )}
          </div>
        </div>

        {isSuccess && !loading && subscription && !subscription.isPremium ? (
          <p role="status" className="mt-5 flex items-start gap-2 rounded-sm border border-olive/30 bg-olive/10 px-3 py-2.5 text-sm text-charcoal">
            <LoaderCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin text-olive" />
            Premium is not active yet. This usually means the confirmation event has not arrived.
          </p>
        ) : null}
      </div>
    </DashboardShell>
  );
}
