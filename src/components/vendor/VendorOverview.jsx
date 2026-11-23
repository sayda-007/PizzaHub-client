"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FormMessage from "@/components/auth/FormMessage";
import { DashboardError, DashboardLoading } from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  isSubscriptionUnconfigured,
  itemNameFromSnapshot,
  normalizePagination,
  planLabel,
} from "@/components/vendor/vendor-data";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES, authClient, getSessionAccountRole } from "@/lib/auth-client";
import { getSubscription, listVendorMenu, listVendorOrders } from "@/lib/dashboard-client";
import { formatDate, formatPrice } from "@/lib/format";

const cardClass = "rounded-sm border border-line bg-surface p-5 sm:p-6";
const outlineButton = "h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted";

function StatCard({ label, value, note }) {
  return (
    <div className={cardClass}>
      <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{label}</p>
      <p className="mt-3 font-heading text-3xl text-charcoal" aria-live="polite">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{note}</p>
    </div>
  );
}

export default function VendorOverview() {
  const { data: session } = authClient.useSession();
  const isVendor = getSessionAccountRole(session) === ACCOUNT_ROLES.VENDOR;

  const [menuData, setMenuData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [errors, setErrors] = useState({ menu: "", orders: "", subscription: "" });
  const [unconfigured, setUnconfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

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
    setErrors({ menu: "", orders: "", subscription: "" });
    setUnconfigured(false);

    Promise.allSettled([
      listVendorMenu({ page: 1, limit: 5 }),
      listVendorOrders({ page: 1, limit: 5 }),
      getSubscription(),
    ]).then(([menuResult, ordersResult, subscriptionResult]) => {
      if (!active) {
        return;
      }

      setMenuData(menuResult.status === "fulfilled" ? menuResult.value : null);
      setOrderData(ordersResult.status === "fulfilled" ? ordersResult.value : null);

      const subscriptionFailed = subscriptionResult.status === "rejected";
      const subscriptionError = subscriptionFailed ? subscriptionResult.reason : null;
      const paymentsUnconfigured = subscriptionFailed && isSubscriptionUnconfigured(subscriptionError);

      setSubscription(
        subscriptionResult.status === "fulfilled"
          ? subscriptionResult.value?.subscription ?? null
          : null,
      );
      setUnconfigured(paymentsUnconfigured);
      setErrors({
        menu: menuResult.status === "rejected"
          ? friendlyApiError(menuResult.reason, "We couldn't load your menu summary.")
          : "",
        orders: ordersResult.status === "rejected"
          ? friendlyApiError(ordersResult.reason, "We couldn't load your order summary.")
          : "",
        subscription:
          subscriptionFailed && !paymentsUnconfigured
            ? friendlyApiError(subscriptionError, "We couldn't read your subscription status.")
            : "",
      });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isVendor, reloadKey]);

  const menuPagination = normalizePagination(menuData?.pagination);
  const orderPagination = normalizePagination(orderData?.pagination);
  const recentItems = Array.isArray(menuData?.items) ? menuData.items.slice(0, 5) : [];
  const recentOrders = Array.isArray(orderData?.items) ? orderData.items.slice(0, 5) : [];
  const bothListsFailed = Boolean(errors.menu && errors.orders);

  return (
    <DashboardShell
      title="Vendor overview"
      description="A live view of your menu, incoming orders and subscription status."
      allowedRoles={[ACCOUNT_ROLES.VENDOR]}
      actions={
        <>
          <Button
            asChild
            className="h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
          >
            <Link href="/vendor/menu">Manage menu</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
          >
            <Link href="/vendor/orders">View orders</Link>
          </Button>
        </>
      }
    >
      {isVendor ? (
        loading ? (
          <DashboardLoading label="Loading your vendor overview..." />
        ) : (
          <div className="space-y-6">
            {bothListsFailed ? (
              <DashboardError
                message="We couldn't load your menu or orders. Your other details are shown below where available."
                onRetry={refresh}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Menu items"
                value={menuPagination.totalItems ?? "—"}
                note={
                  menuPagination.totalItems === null
                    ? "Total not reported by the server"
                    : "Reported by your menu API"
                }
              />
              <StatCard
                label="Vendor orders"
                value={orderPagination.totalItems ?? "—"}
                note={
                  orderPagination.totalItems === null
                    ? "Total not reported by the server"
                    : "Reported by your orders API"
                }
              />
              <StatCard
                label="Subscription"
                value={
                  unconfigured
                    ? "Not configured"
                    : errors.subscription
                      ? "Unavailable"
                      : subscription?.isPremium === undefined
                        ? "—"
                        : subscription.isPremium
                          ? "Premium"
                          : "Free"
                }
                note={
                  unconfigured || errors.subscription
                    ? "No plan status reported"
                    : planLabel(subscription?.plan)
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl text-charcoal">Recent menu submissions</h2>
                  <Button asChild variant="outline" size="sm" className={outlineButton}>
                    <Link href="/vendor/menu">
                      View all
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                {errors.menu ? (
                  <div className="mt-4">
                    <FormMessage>{errors.menu}</FormMessage>
                  </div>
                ) : recentItems.length === 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    No menu items yet. Add one from the menu page to get started.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {recentItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href="/vendor/menu"
                            className="font-medium text-charcoal hover:text-tomato"
                          >
                            {item.itemName ?? "Untitled item"}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {formatDate(item.createdAt)}
                            {item.category ? ` · ${item.category}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-charcoal">
                            {formatPrice(item.price)}
                          </span>
                          <StatusBadge type="menu" status={item.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl text-charcoal">Recent vendor orders</h2>
                  <Button asChild variant="outline" size="sm" className={outlineButton}>
                    <Link href="/vendor/orders">
                      View all
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                {errors.orders ? (
                  <div className="mt-4">
                    <FormMessage>{errors.orders}</FormMessage>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    No customer orders yet. New orders for your kitchen will appear here.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {recentOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href="/vendor/orders"
                            className="font-medium text-charcoal hover:text-tomato"
                          >
                            {itemNameFromSnapshot(order.itemSnapshot)}
                          </Link>
                          <p className="mt-0.5 break-all text-xs text-ink-muted">
                            Order {order.id} · {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-charcoal">
                            {formatPrice(order.price)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-2xl text-charcoal">Subscription</h2>
                <Button asChild variant="outline" size="sm" className={outlineButton}>
                  <Link href="/vendor/subscription">
                    Manage subscription
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              {unconfigured ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  Subscription payments are not configured on this deployment. No premium status is
                  assumed here.
                </p>
              ) : errors.subscription ? (
                <div className="mt-4">
                  <FormMessage>{errors.subscription}</FormMessage>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      type="subscription"
                      status={subscription?.status}
                      label={subscription?.status ? undefined : "Not available"}
                    />
                    <span className="font-medium text-charcoal">
                      {planLabel(subscription?.plan)}
                    </span>
                  </div>
                  <span>
                    {subscription?.cancelAtPeriodEnd ? "Ends" : "Expires or renews"}{" "}
                    {subscription?.expiresAt ? formatDate(subscription.expiresAt) : "—"}
                  </span>
                  {subscription?.cancelAtPeriodEnd ? (
                    <span>Premium continues until the period end.</span>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        )
      ) : null}
    </DashboardShell>
  );
}
