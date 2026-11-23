"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import {
  DashboardEmpty,
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Pagination from "@/components/dashboard/Pagination";
import StatusBadge from "@/components/dashboard/StatusBadge";
import MenuImage from "@/components/menu/MenuImage";
import { Button } from "@/components/ui/button";
import { cancelCustomerOrder, listCustomerOrders } from "@/lib/dashboard-client";
import { formatDate, formatPrice } from "@/lib/format";
import { ACCOUNT_ROLES } from "@/lib/auth-client";
import { ORDER_STATUSES } from "@/lib/status";

const PAGE_SIZE = 10;

function OrderCard({ order, onCancel, cancelling, confirming, onConfirm, onKeep }) {
  const snapshot = order.itemSnapshot ?? {};
  const images = Array.isArray(snapshot.images) ? snapshot.images : [];

  return (
    <article className="rounded-sm border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-sm border border-line bg-muted sm:size-28">
          <MenuImage src={images[0]} alt="" sizes="112px" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl text-charcoal">
                {snapshot.itemName ?? "Menu item"}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Order {order.id} · Placed {formatDate(order.createdAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4" />
              Delivery {formatDate(order.deliveryDate)}
            </span>
            <span className="inline-flex items-start gap-1.5">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {order.deliveryAddress}
            </span>
            <span className="font-semibold text-charcoal">{formatPrice(order.price)}</span>
          </div>

          {confirming ? (
            <div className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-charcoal">Cancel this pending order?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={cancelling}
                  onClick={onConfirm}
                  className="h-9 bg-destructive px-3 text-paper hover:bg-destructive/90"
                >
                  {cancelling ? "Cancelling..." : "Yes, cancel order"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={cancelling}
                  onClick={onKeep}
                  className="h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
                >
                  Keep order
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-line bg-paper text-charcoal hover:bg-muted"
              >
                <Link href={`/orders/${order.id}`}>
                  View details
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {order.status === ORDER_STATUSES.PENDING ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={cancelling}
                  onClick={onCancel}
                >
                  Cancel order
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await listCustomerOrders({ page, limit: PAGE_SIZE });
      setOrders(Array.isArray(result?.items) ? result.items : []);
      setPagination(result?.pagination ?? null);
    } catch (loadError) {
      setError(loadError?.message ?? "We couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function refresh() {
    setLoading(true);
    setError("");
    load();
  }

  async function confirmCancel(id) {
    setCancellingId(id);
    setActionError("");

    try {
      const result = await cancelCustomerOrder(id);
      const updated = result?.order;

      if (updated) {
        setOrders((current) =>
          current.map((order) => (order.id === id ? { ...order, ...updated } : order)),
        );
      } else {
        await load();
      }

      setConfirmingId("");
    } catch (cancelError) {
      setActionError(cancelError?.message ?? "We couldn't cancel that order.");
    } finally {
      setCancellingId("");
    }
  }

  return (
    <DashboardShell
      title="My orders"
      description="Follow every order you have placed, review the details, and cancel a pending order if plans change."
      allowedRoles={[ACCOUNT_ROLES.CUSTOMER]}
      actions={
        <Button asChild className="h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep">
          <Link href="/menu">Browse menu</Link>
        </Button>
      }
    >
      {actionError ? <p role="alert" className="mb-4 text-sm text-destructive">{actionError}</p> : null}

      {loading ? (
        <DashboardLoading label="Loading your orders..." />
      ) : error ? (
        <DashboardError message={error} onRetry={refresh} />
      ) : orders.length === 0 ? (
        <DashboardEmpty
          title="No orders yet"
          description="When you place an order from the menu, you will be able to track it here."
          href="/menu"
          actionLabel="Find something delicious"
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                cancelling={cancellingId === order.id}
                confirming={confirmingId === order.id}
                onCancel={() => {
                  setActionError("");
                  setConfirmingId(order.id);
                }}
                onConfirm={() => confirmCancel(order.id)}
                onKeep={() => setConfirmingId("")}
              />
            ))}
          </div>
          <Pagination
            pagination={pagination}
            disabled={loading}
            onChange={(nextPage) => {
              setConfirmingId("");
              setLoading(true);
              setError("");
              setPage(nextPage);
            }}
          />
        </>
      )}
    </DashboardShell>
  );
}
