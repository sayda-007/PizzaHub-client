"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

import FormMessage from "@/components/auth/FormMessage";
import {
  DashboardEmpty,
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Pagination from "@/components/dashboard/Pagination";
import { Button } from "@/components/ui/button";
import VendorOrderCard from "@/components/vendor/VendorOrderCard";
import {
  normalizePagination,
  paginationControl,
  totalSummary,
} from "@/components/vendor/vendor-data";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES, authClient, getSessionAccountRole } from "@/lib/auth-client";
import { listVendorOrders, updateVendorOrderStatus } from "@/lib/dashboard-client";
import { ORDER_STATUSES } from "@/lib/status";

const PAGE_SIZE = 10;

const FILTERS = [
  { value: "all", label: "All statuses" },
  { value: ORDER_STATUSES.PENDING, label: "Pending" },
  { value: ORDER_STATUSES.ACCEPTED, label: "Accepted" },
  { value: ORDER_STATUSES.REJECTED, label: "Rejected" },
  { value: ORDER_STATUSES.CANCELLED, label: "Cancelled" },
];

export default function VendorOrdersPage() {
  const filterId = useId();
  const { data: session } = authClient.useSession();
  const isVendor = getSessionAccountRole(session) === ACCOUNT_ROLES.VENDOR;

  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalItems: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
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

    listVendorOrders({ status: status === "all" ? "" : status, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) {
          return;
        }

        setOrders(Array.isArray(result?.items) ? result.items : []);
        setPagination(normalizePagination(result?.pagination));
      })
      .catch((loadError) => {
        if (active) {
          setError(friendlyApiError(loadError, "We couldn't load your vendor orders."));
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
  }, [isVendor, status, page, reloadKey]);

  async function handleDecision(id, nextStatus) {
    setBusyId(id);
    setActionError("");
    setSuccess("");

    try {
      await updateVendorOrderStatus(id, nextStatus);
      setSuccess(
        nextStatus === ORDER_STATUSES.ACCEPTED
          ? "Order accepted."
          : "Order rejected.",
      );

      if (orders.length === 1 && page > 1) {
        setPage(1);
      } else {
        refresh();
      }
    } catch (decisionError) {
      setActionError(friendlyApiError(decisionError, "We couldn't update that order."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <DashboardShell
      title="Vendor orders"
      description="Review incoming customer orders and accept or reject the ones waiting for your kitchen."
      allowedRoles={[ACCOUNT_ROLES.VENDOR]}
      actions={
        <Button
          asChild
          variant="outline"
          className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
        >
          <Link href="/vendor/menu">Manage menu</Link>
        </Button>
      }
    >
      {isVendor ? (
        <div className="space-y-5">
          <section className="rounded-sm border border-line bg-surface p-4 sm:p-5">
            <label
              htmlFor={filterId}
              className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase"
            >
              Filter orders
            </label>
            <select
              id={filterId}
              value={status}
              onChange={(event) => {
                setActionError("");
                setSuccess("");
                setStatus(event.target.value);
                setPage(1);
              }}
              disabled={loading || Boolean(busyId)}
              className="mt-2 h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal transition-colors focus-visible:border-tomato focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/25 disabled:opacity-60 sm:max-w-xs"
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>

          <FormMessage tone="success">{success}</FormMessage>
          <FormMessage>{actionError}</FormMessage>

          {error ? <DashboardError message={error} onRetry={refresh} /> : null}
          {loading ? <DashboardLoading label="Loading your orders..." /> : null}

          {!loading && !error && orders.length === 0 ? (
            <DashboardEmpty
              title="No orders in this view"
              description={
                status === "all"
                  ? "Customer orders for your kitchen will appear here as soon as they are placed."
                  : "No orders currently have this status. Choose another filter to see more."
              }
            />
          ) : null}

          {!loading && !error && orders.length > 0 ? (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    busy={busyId === order.id}
                    onDecision={handleDecision}
                  />
                ))}
              </div>

              <p className="text-xs text-ink-muted" aria-live="polite">
                {totalSummary(pagination.totalItems)}
              </p>
              {pagination.totalItems === null ? (
                <p className="text-xs text-ink-muted">
                  The server did not include a total count with your orders.
                </p>
              ) : null}
              <Pagination
                pagination={paginationControl(pagination)}
                disabled={loading || Boolean(busyId)}
                onChange={setPage}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </DashboardShell>
  );
}
