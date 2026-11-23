"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

import FormMessage from "@/components/auth/FormMessage";
import { DashboardError, DashboardLoading } from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  isSubscriptionUnconfigured,
  planLabel,
} from "@/components/vendor/vendor-data";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES, authClient, getSessionAccountRole } from "@/lib/auth-client";
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getSubscription,
} from "@/lib/dashboard-client";
import { formatDate } from "@/lib/format";
import { SUBSCRIPTION_STATUSES } from "@/lib/status";

const labelClass = "text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";

export default function VendorSubscriptionPage() {
  const confirmId = useId();
  const { data: session } = authClient.useSession();
  const isVendor = getSessionAccountRole(session) === ACCOUNT_ROLES.VENDOR;

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unconfigured, setUnconfigured] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  function refresh() {
    setReloadKey((current) => current + 1);
  }

  useEffect(() => {
    if (!isVendor) {
      return undefined;
    }

    let active = true;
    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setUnconfigured(false);

    getSubscription()
      .then((result) => {
        if (active) {
          setSubscription(result?.subscription ?? null);
        }
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        if (isSubscriptionUnconfigured(loadError)) {
          setUnconfigured(true);
          setSubscription(null);
        } else {
          setError(friendlyApiError(loadError, "We couldn't read your subscription status."));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isVendor, reloadKey]);

  async function handleCheckout() {
    setFormError("");
    setSuccess("");
    setBusy("checkout");

    try {
      const result = await createSubscriptionCheckout();
      const checkoutUrl = result?.checkoutUrl;

      if (typeof checkoutUrl !== "string" || !checkoutUrl.trim()) {
        setFormError("Stripe did not return a checkout link. Please try again.");
        return;
      }

      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      if (isSubscriptionUnconfigured(checkoutError)) {
        setUnconfigured(true);
      }

      setFormError(friendlyApiError(checkoutError, "We couldn't open Stripe checkout."));
    } finally {
      setBusy("");
    }
  }

  async function handleCancel() {
    setFormError("");
    setSuccess("");
    setBusy("cancel");

    try {
      const result = await cancelSubscription();
      const next = result?.subscription;
      const alreadyCanceled =
        next?.status === SUBSCRIPTION_STATUSES.CANCELED ||
        (next?.plan === "free" && next?.isPremium === false);

      setConfirmCancel(false);
      setSuccess(
        alreadyCanceled
          ? "The subscription is canceled. No further payment is scheduled."
          : "Cancellation scheduled. Premium access continues until the end of the period.",
      );
      refresh();
    } catch (cancelError) {
      if (isSubscriptionUnconfigured(cancelError)) {
        setUnconfigured(true);
      }

      setFormError(friendlyApiError(cancelError, "We couldn't cancel your subscription."));
    } finally {
      setBusy("");
    }
  }

  // The backend owns this decision and never exposes Stripe ids to the client.
  const canCancel = Boolean(subscription?.canCancel) && !subscription.cancelAtPeriodEnd;
  const accessLabel =
    subscription?.isPremium === undefined
      ? "Not available"
      : subscription.isPremium
        ? "Premium"
        : "Free";
  const expiryLabel = subscription?.expiresAt
    ? formatDate(subscription.expiresAt)
    : "No expiry date on record";

  return (
    <DashboardShell
      title="Subscription"
      description="Check your current plan, upgrade through Stripe checkout, and see when any cancellation takes effect."
      allowedRoles={[ACCOUNT_ROLES.VENDOR]}
    >
      {isVendor ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <FormMessage>{formError}</FormMessage>
            <FormMessage tone="success">{success}</FormMessage>

            {unconfigured ? (
              <section className="rounded-sm border border-line bg-surface p-5 sm:p-7">
                <h2 className="font-heading text-2xl text-charcoal">
                  Payments are not configured
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Subscription checkout is not available on this deployment yet. No payment details
                  have been collected here, and your plan remains whatever the backend has on
                  record.
                </p>
              </section>
            ) : loading ? (
              <DashboardLoading label="Checking your subscription..." />
            ) : error ? (
              <DashboardError message={error} onRetry={refresh} />
            ) : (
              <section className="rounded-sm border border-line bg-surface p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl text-charcoal">Your current plan</h2>
                  <StatusBadge
                    type="subscription"
                    status={subscription?.status}
                    label={subscription?.status ? undefined : "Not available"}
                  />
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className={labelClass}>Plan</dt>
                    <dd className="mt-1.5 text-sm font-medium text-charcoal">
                      {planLabel(subscription?.plan)}
                    </dd>
                  </div>
                  <div>
                    <dt className={labelClass}>Access</dt>
                    <dd className="mt-1.5 text-sm font-medium text-charcoal">{accessLabel}</dd>
                  </div>
                  <div>
                    <dt className={labelClass}>
                      {subscription?.cancelAtPeriodEnd ? "Ends on" : "Expires or renews"}
                    </dt>
                    <dd className="mt-1.5 text-sm text-charcoal">{expiryLabel}</dd>
                  </div>
                  <div>
                    <dt className={labelClass}>Cancellation</dt>
                    <dd className="mt-1.5 text-sm text-charcoal">
                      {subscription?.cancelAtPeriodEnd
                        ? "Scheduled for period end"
                        : subscription
                          ? "Not scheduled"
                          : "Not available"}
                    </dd>
                  </div>
                </dl>

                {subscription?.cancelAtPeriodEnd && subscription?.expiresAt ? (
                  <p className="mt-5 rounded-sm border border-line bg-paper px-3 py-2.5 text-sm leading-relaxed text-charcoal">
                    Premium access continues until {formatDate(subscription.expiresAt)}.
                  </p>
                ) : null}
              </section>
            )}

            {!unconfigured ? (
              <section className="rounded-sm border border-line bg-surface p-5 sm:p-7">
                <h2 className="font-heading text-2xl text-charcoal">Manage billing</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Payment is handled securely by Stripe. PizzaHub never stores your card details,
                  and your account is updated only after the backend confirms the payment.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {subscription?.isPremium ? (
                    <Button
                      type="button"
                      disabled
                      className="h-10 bg-olive px-4 text-paper hover:bg-olive"
                    >
                      Premium active
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleCheckout}
                      disabled={Boolean(busy) || loading || Boolean(error)}
                      className="h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
                    >
                      {busy === "checkout" ? "Opening Stripe..." : "Upgrade to Premium"}
                    </Button>
                  )}

                  {canCancel ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormError("");
                        setSuccess("");
                        setConfirmCancel(true);
                      }}
                      disabled={Boolean(busy)}
                      className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
                    >
                      Cancel subscription
                    </Button>
                  ) : null}
                </div>

                {confirmCancel ? (
                  <div
                    role="alertdialog"
                    aria-labelledby={`${confirmId}-title`}
                    aria-describedby={`${confirmId}-description`}
                    className="mt-5 rounded-sm border border-destructive/30 bg-destructive/5 p-4"
                  >
                    <p id={`${confirmId}-title`} className="text-sm font-semibold text-charcoal">
                      Cancel your subscription?
                    </p>
                    <p
                      id={`${confirmId}-description`}
                      className="mt-1 text-sm leading-relaxed text-ink-muted"
                    >
                      Premium access stays active until the end of the current billing period.
                      You can keep your plan if you are not ready.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleCancel}
                        disabled={busy === "cancel"}
                        className="h-9 bg-destructive px-3 text-paper hover:bg-destructive/90"
                      >
                        {busy === "cancel" ? "Cancelling..." : "Yes, cancel at period end"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirmCancel(false)}
                        disabled={busy === "cancel"}
                        className="h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
                      >
                        Keep my plan
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-sm border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-heading text-xl text-charcoal">Plans and limits</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              The Free plan allows 3 active menu items. If your kitchen needs more room, use
              checkout above to start a premium plan through Stripe.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Plan status, item limits and billing dates always come from your PizzaHub account on
              the server.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-5 h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
            >
              <Link href="/vendor/menu">Review my menu</Link>
            </Button>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
