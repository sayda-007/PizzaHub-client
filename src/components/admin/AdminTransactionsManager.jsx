"use client";

import { useEffect, useState } from "react";

import FormMessage from "@/components/auth/FormMessage";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  DashboardEmpty,
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import Pagination from "@/components/dashboard/Pagination";
import { Button } from "@/components/ui/button";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES } from "@/lib/auth-client";
import { listAdminTransactions } from "@/lib/dashboard-client";
import { formatDateTime, formatPrice } from "@/lib/format";
import { statusBadgeClass } from "@/lib/status";

const PAGE_LIMIT = 12;
const EMPTY_FILTERS = Object.freeze({
  status: "",
  vendorId: "",
  fromDate: "",
  toDate: "",
});

const STATUS_OPTIONS = Object.freeze([
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
]);

const TRANSACTION_STATUS_META = Object.freeze({
  pending: { label: "Pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
});

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-10 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted";

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateFilters(values) {
  const vendorId = values.vendorId.trim();

  if (vendorId && !/^[0-9a-f]{24}$/i.test(vendorId)) {
    return "Vendor id must be a 24-character hexadecimal MongoDB id.";
  }

  if (values.fromDate && !isCalendarDate(values.fromDate)) {
    return "Enter a valid start date.";
  }

  if (values.toDate && !isCalendarDate(values.toDate)) {
    return "Enter a valid end date.";
  }

  if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
    return "End date must be on or after start date.";
  }

  return "";
}

function formatAmount(amount, currency) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return formatPrice(amount);
  }

  const code =
    typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency.trim())
      ? currency.trim().toUpperCase()
      : "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(value / 100);
  } catch {
    return formatPrice(value / 100);
  }
}

function formatEventCreated(value) {
  const seconds = Number(value);

  return Number.isFinite(seconds) && seconds > 0
    ? formatDateTime(seconds * 1000)
    : "—";
}

function AdminTransactionsContent() {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    listAdminTransactions({ ...filters, page, limit: PAGE_LIMIT })
      .then((payload) => {
        if (!active) {
          return;
        }

        const list = Array.isArray(payload?.transactions) ? payload.transactions : [];
        setTransactions(list);
        setPagination(payload?.pagination ?? null);

        const totalPages = Number(payload?.pagination?.totalPages);

        if (Number.isFinite(totalPages) && page > Math.max(totalPages, 1)) {
          setPage(Math.max(totalPages, 1));
        }
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        setTransactions([]);
        setPagination(null);
        setError(friendlyApiError(requestError, "We couldn't load payment records."));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [filters, page, reloadKey]);

  function applyFilters(next) {
    const normalized = {
      status: next.status,
      vendorId: next.vendorId.trim(),
      fromDate: next.fromDate,
      toDate: next.toDate,
    };

    setDraft(normalized);
    setFilters(normalized);
    setPage(1);
    setValidationError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const message = validateFilters(draft);

    if (message) {
      setValidationError(message);
      return;
    }

    applyFilters(draft);
  }

  function handlePageChange(nextPage) {
    setPage(nextPage);
    setValidationError("");
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Filter payment records"
          className="rounded-sm border border-line bg-surface p-5 sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="admin-tx-status" className={labelClass}>
                Status
              </label>
              <select
                id="admin-tx-status"
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, status: event.target.value }))
                }
                className={controlClass}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="admin-tx-vendor" className={labelClass}>
                Vendor ID
              </label>
              <input
                id="admin-tx-vendor"
                type="text"
                value={draft.vendorId}
                maxLength={24}
                pattern="[0-9a-fA-F]{24}"
                title="Enter a 24-character hexadecimal MongoDB id."
                placeholder="24-character hex id"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, vendorId: event.target.value }))
                }
                className={`${controlClass} font-mono text-xs`}
              />
            </div>

            <div>
              <label htmlFor="admin-tx-from" className={labelClass}>
                From date
              </label>
              <input
                id="admin-tx-from"
                type="date"
                value={draft.fromDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, fromDate: event.target.value }))
                }
                className={controlClass}
              />
            </div>

            <div>
              <label htmlFor="admin-tx-to" className={labelClass}>
                To date
              </label>
              <input
                id="admin-tx-to"
                type="date"
                value={draft.toDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, toDate: event.target.value }))
                }
                className={controlClass}
              />
            </div>
          </div>

          {validationError ? (
            <div className="mt-4">
              <FormMessage>{validationError}</FormMessage>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-xs text-ink-muted">
              Records are read-only and change through the payment webhook.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => applyFilters(EMPTY_FILTERS)}
                className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
              >
                Clear filters
              </Button>
              <Button
                type="submit"
                className="h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
              >
                Apply filters
              </Button>
            </div>
          </div>
        </form>

        {error ? (
          <DashboardError
            message={error}
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        ) : null}

        {loading ? (
          <DashboardLoading label="Loading payment records..." />
        ) : error ? null : transactions.length === 0 ? (
          <div className="space-y-4">
            <DashboardEmpty
              title="No payment records found"
              description={
                hasFilters
                  ? "No records match these filters. Check the vendor id, status, or date range."
                  : "There are no payment records to show yet."
              }
            />
            {hasFilters ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyFilters(EMPTY_FILTERS)}
                  className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
                >
                  Clear filters
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              {transactions.map((transaction) => (
                <AdminTransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
            <Pagination
              pagination={pagination}
              onChange={handlePageChange}
              disabled={loading}
            />
          </>
        )}
    </div>
  );
}

export default function AdminTransactionsManager() {
  return (
    <DashboardShell
      title="Payment records"
      description="Read-only Stripe-backed transactions. Filters are validated before they reach the admin API."
      allowedRoles={[ACCOUNT_ROLES.ADMIN]}
    >
      <AdminTransactionsContent />
    </DashboardShell>
  );
}

function TransactionStatusBadge({ status }) {
  const meta = TRANSACTION_STATUS_META[status] ?? {
    label: status || "Unknown",
    tone: "neutral",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(meta)}`}
    >
      {meta.label}
    </span>
  );
}

function TransactionField({ label, value, mono = false }) {
  if (!value) {
    return null;
  }

  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd
        className={`mt-0.5 break-all font-medium text-charcoal ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function AdminTransactionCard({ transaction }) {
  const amountLabel = formatAmount(transaction.amount, transaction.currency);

  return (
    <article className="rounded-sm border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Transaction
          </p>
          <h3 className="mt-1 break-all font-heading text-lg text-charcoal">
            {transaction.id || "Record"}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TransactionStatusBadge status={transaction.status} />
          <span className="font-heading text-lg text-charcoal">{amountLabel}</span>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <TransactionField label="Vendor ID" value={transaction.vendorId} mono />
        <TransactionField label="Payment status" value={transaction.paymentStatus} />
        <TransactionField label="Event type" value={transaction.eventType} />
        <TransactionField
          label="Created"
          value={formatDateTime(transaction.createdAt)}
        />
        <TransactionField
          label="Stripe session"
          value={transaction.stripeSessionId}
          mono
        />
        <TransactionField
          label="Checkout session"
          value={transaction.stripeCheckoutSessionId}
          mono
        />
        <TransactionField label="Invoice" value={transaction.stripeInvoiceId} mono />
        <TransactionField
          label="Subscription"
          value={transaction.stripeSubscriptionId}
          mono
        />
        <TransactionField label="Stripe event" value={transaction.stripeEventId} mono />
        <TransactionField
          label="Stripe event time"
          value={formatEventCreated(transaction.stripeEventCreated)}
        />
      </dl>
    </article>
  );
}
