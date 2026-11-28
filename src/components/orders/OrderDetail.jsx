"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, MessageSquareText } from "lucide-react";

import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import OrderTimeline from "@/components/dashboard/OrderTimeline";
import StatusBadge from "@/components/dashboard/StatusBadge";
import MenuImage from "@/components/menu/MenuImage";
import { Button } from "@/components/ui/button";
import { ACCOUNT_ROLES, useAuthorizedSession } from "@/lib/auth-client";
import { cancelCustomerOrder, getCustomerOrder } from "@/lib/dashboard-client";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/status";

export default function OrderDetail({ id }) {
  const { canLoad } = useAuthorizedSession([ACCOUNT_ROLES.CUSTOMER]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getCustomerOrder(id);
      setOrder(result?.order ?? null);
    } catch (loadError) {
      setError(loadError?.message ?? "We couldn't load this order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [canLoad, load]);

  async function confirmCancel() {
    setCancelling(true);
    setActionError("");

    try {
      const result = await cancelCustomerOrder(id);

      if (result?.order) {
        setOrder(result.order);
      } else {
        await load();
      }

      setConfirming(false);
    } catch (cancelError) {
      setActionError(cancelError?.message ?? "We couldn't cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  const snapshot = order?.itemSnapshot ?? {};
  const images = Array.isArray(snapshot.images) ? snapshot.images : [];

  return (
    <DashboardShell
      title="Order details"
      description="Everything we know about this order, including its current status and delivery details."
      allowedRoles={[ACCOUNT_ROLES.CUSTOMER]}
      actions={
        <Button asChild variant="outline" className="border-line bg-paper text-charcoal">
          <Link href="/orders">
            <ArrowLeft aria-hidden="true" />
            All orders
          </Link>
        </Button>
      }
    >
      {loading ? (
        <DashboardLoading label="Loading order details..." />
      ) : error || !order ? (
        <DashboardError message={error || "This order is no longer available."} onRetry={load} />
      ) : (
        <div className="space-y-6">
          {actionError ? (
            <p role="alert" className="rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <section className="rounded-sm border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl text-charcoal">
                  {snapshot.itemName ?? "Menu item"}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Order {order.id} · Placed {formatDateTime(order.createdAt)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-line bg-muted">
                <MenuImage src={images[0]} alt="" sizes="(max-width: 767px) 100vw, 180px" />
              </div>

              <div className="space-y-4 text-sm text-ink-muted">
                {snapshot.description ? <p className="leading-relaxed">{snapshot.description}</p> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-sm border border-line bg-paper p-3">
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Delivery date
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 font-medium text-charcoal">
                      <CalendarDays aria-hidden="true" className="size-4 text-tomato" />
                      {formatDate(order.deliveryDate)}
                    </p>
                  </div>
                  <div className="rounded-sm border border-line bg-paper p-3">
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Order total
                    </p>
                    <p className="mt-1.5 font-heading text-xl text-charcoal">
                      {formatPrice(order.price)}
                    </p>
                  </div>
                </div>
                <p className="flex items-start gap-2">
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tomato" />
                  {order.deliveryAddress}
                </p>
                {order.additionalMessage ? (
                  <p className="flex items-start gap-2">
                    <MessageSquareText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tomato" />
                    {order.additionalMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-heading text-xl text-charcoal">Status timeline</h2>
            <div className="mt-5 max-w-md">
              <OrderTimeline status={order.status} />
            </div>
          </section>

          {order.status === ORDER_STATUSES.PENDING ? (
            <section className="rounded-sm border border-line bg-surface p-5 sm:p-6">
              {confirming ? (
                <div>
                  <h2 className="font-heading text-xl text-charcoal">Cancel this order?</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    The kitchen will be told not to prepare it. This cannot be undone.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={cancelling}
                      onClick={confirmCancel}
                      className="h-10 bg-destructive px-4 text-paper hover:bg-destructive/90"
                    >
                      {cancelling ? "Cancelling..." : "Yes, cancel order"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cancelling}
                      onClick={() => setConfirming(false)}
                      className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
                    >
                      Keep order
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-muted">
                    Plans changed? You can cancel while the order is still pending.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirming(true)}
                  >
                    Cancel order
                  </Button>
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}
