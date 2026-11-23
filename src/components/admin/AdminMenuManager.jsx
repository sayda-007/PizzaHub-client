"use client";

import { useEffect, useState } from "react";

import FormMessage from "@/components/auth/FormMessage";
import AdminConfirmBar from "@/components/admin/AdminConfirmBar";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  DashboardEmpty,
  DashboardError,
  DashboardLoading,
} from "@/components/dashboard/DashboardStates";
import Pagination from "@/components/dashboard/Pagination";
import StatusBadge from "@/components/dashboard/StatusBadge";
import MenuImage from "@/components/menu/MenuImage";
import { Button } from "@/components/ui/button";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES } from "@/lib/auth-client";
import {
  deleteAdminMenu,
  listAdminMenu,
  moderateAdminMenu,
  setAdminMenuAvailability,
} from "@/lib/dashboard-client";
import { formatDate, formatPrice } from "@/lib/format";
import { MENU_CATEGORIES } from "@/lib/menu-query";
import { MENU_STATUSES, menuStatusMeta, statusBadgeClass } from "@/lib/status";

const PAGE_LIMIT = 12;
const EMPTY_FILTERS = Object.freeze({
  search: "",
  status: "",
  category: "",
  location: "",
});

const STATUS_OPTIONS = Object.freeze([
  { value: "", label: "All statuses" },
  ...Object.values(MENU_STATUSES).map((status) => ({
    value: status,
    label: menuStatusMeta(status).label,
  })),
]);

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-10 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted";

function AdminMenuContent() {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    listAdminMenu({ ...filters, page, limit: PAGE_LIMIT })
      .then((payload) => {
        if (!active) {
          return;
        }

        const list = Array.isArray(payload?.items) ? payload.items : [];
        setItems(list);
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

        setItems([]);
        setPagination(null);
        setError(friendlyApiError(requestError, "We couldn't load menu items."));
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

  function clearActionState() {
    setNotice("");
    setActionError("");
  }

  function applyFilters(next) {
    const normalized = {
      search: next.search.trim(),
      status: next.status,
      category: next.category,
      location: next.location.trim(),
    };

    setDraft(normalized);
    setFilters(normalized);
    setPage(1);
    setConfirm(null);
    clearActionState();
  }

  function handleSubmit(event) {
    event.preventDefault();
    applyFilters(draft);
  }

  function handlePageChange(nextPage) {
    setPage(nextPage);
    setConfirm(null);
    clearActionState();
  }

  async function handleModerate(item, status) {
    setConfirm(null);
    clearActionState();
    setBusy(`moderate:${item.id}`);

    try {
      await moderateAdminMenu(item.id, status);
      setNotice(
        status === MENU_STATUSES.APPROVED
          ? "Menu item approved."
          : "Menu item rejected.",
      );
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setActionError(friendlyApiError(requestError, "We couldn't update this item."));
    } finally {
      setBusy("");
    }
  }

  async function handleAvailability(item) {
    const nextAvailable = !item.isAvailable;

    setConfirm(null);
    clearActionState();
    setBusy(`availability:${item.id}`);

    try {
      await setAdminMenuAvailability(item.id, nextAvailable);
      setNotice(
        nextAvailable
          ? "Menu item is now available to customers."
          : "Menu item is now unavailable to customers.",
      );
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setActionError(friendlyApiError(requestError, "We couldn't change availability."));
    } finally {
      setBusy("");
    }
  }

  function requestDelete(item) {
    clearActionState();
    setConfirm(item);
  }

  async function handleDelete(item) {
    clearActionState();
    setBusy(`delete:${item.id}`);

    try {
      await deleteAdminMenu(item.id);
      setNotice("Menu item deleted.");
      setConfirm(null);

      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setReloadKey((value) => value + 1);
      }
    } catch (requestError) {
      setActionError(friendlyApiError(requestError, "We couldn't delete this item."));
    } finally {
      setBusy("");
    }
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
        <form
          onSubmit={handleSubmit}
          aria-label="Filter menu items"
          className="rounded-sm border border-line bg-surface p-5 sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="admin-menu-search" className={labelClass}>
                Search
              </label>
              <input
                id="admin-menu-search"
                type="search"
                value={draft.search}
                maxLength={100}
                placeholder="Item name or description"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, search: event.target.value }))
                }
                className={controlClass}
              />
            </div>

            <div>
              <label htmlFor="admin-menu-status" className={labelClass}>
                Status
              </label>
              <select
                id="admin-menu-status"
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
              <label htmlFor="admin-menu-category" className={labelClass}>
                Category
              </label>
              <select
                id="admin-menu-category"
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, category: event.target.value }))
                }
                className={controlClass}
              >
                <option value="">All categories</option>
                {MENU_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="admin-menu-location" className={labelClass}>
                Location
              </label>
              <input
                id="admin-menu-location"
                type="text"
                value={draft.location}
                maxLength={120}
                placeholder="Kitchen location"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, location: event.target.value }))
                }
                className={controlClass}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-xs text-ink-muted">
              Changing filters returns to the first page.
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

        {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
        {actionError ? <FormMessage>{actionError}</FormMessage> : null}
        {error ? (
          <DashboardError
            message={error}
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        ) : null}

        {loading ? (
          <DashboardLoading label="Loading menu items..." />
        ) : error ? null : items.length === 0 ? (
          <div className="space-y-4">
            <DashboardEmpty
              title="No menu items found"
              description={
                hasFilters
                  ? "No items match these filters. Try a different search, status, category, or location."
                  : "There are no menu items to review right now."
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
              {items.map((item) => (
                <AdminMenuCard
                  key={item.id}
                  item={item}
                  busy={busy}
                  confirming={confirm?.id === item.id}
                  onModerate={handleModerate}
                  onAvailability={handleAvailability}
                  onRequestDelete={requestDelete}
                  onConfirmDelete={() => handleDelete(item)}
                  onCancelDelete={() => setConfirm(null)}
                />
              ))}
            </div>
            <Pagination
              pagination={pagination}
              onChange={handlePageChange}
              disabled={loading || Boolean(busy)}
            />
          </>
        )}
    </div>
  );
}

export default function AdminMenuManager() {
  return (
    <DashboardShell
      title="Menu moderation"
      description="Review vendor submissions, decide what goes live, and manage availability for published items."
      allowedRoles={[ACCOUNT_ROLES.ADMIN]}
    >
      <AdminMenuContent />
    </DashboardShell>
  );
}

function AdminMenuCard({
  item,
  busy,
  confirming,
  onModerate,
  onAvailability,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}) {
  const isPending = item.status === MENU_STATUSES.PENDING;
  const isApproved = item.status === MENU_STATUSES.APPROVED;
  const image = Array.isArray(item.images) ? item.images[0] : null;
  const availabilityMeta = item.isAvailable
    ? { label: "Available", tone: "success" }
    : { label: "Unavailable", tone: "neutral" };
  const allDisabled = Boolean(busy);

  return (
    <article className="rounded-sm border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-sm bg-muted sm:aspect-auto sm:h-32 sm:w-40">
          <MenuImage
            src={image}
            alt={item.itemName ? `${item.itemName} thumbnail` : "Menu item thumbnail"}
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 20vw"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">
                {item.category || "Uncategorized"}
              </p>
              <h3 className="mt-1 font-heading text-lg text-charcoal">
                {item.itemName || "Untitled item"}
              </h3>
            </div>
            <StatusBadge type="menu" status={item.status} />
          </div>

          {item.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
              {item.description}
            </p>
          ) : null}

          <dl className="mt-4 grid gap-x-4 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Price</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {formatPrice(item.price)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Location</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {item.location || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Submitted</dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {formatDate(item.createdAt)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-ink-muted">Vendor ID</dt>
              <dd className="mt-0.5 break-all font-medium text-charcoal">
                {item.vendorId || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(availabilityMeta)}`}
            >
              {availabilityMeta.label}
            </span>

            {isPending ? (
              <>
                <Button
                  type="button"
                  onClick={() => onModerate(item, MENU_STATUSES.APPROVED)}
                  disabled={allDisabled}
                  className="h-9 bg-tomato px-3 text-paper hover:bg-tomato-deep hover:text-paper"
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onModerate(item, MENU_STATUSES.REJECTED)}
                  disabled={allDisabled}
                  className="h-9 px-3"
                >
                  Reject
                </Button>
              </>
            ) : null}

            {isApproved ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onAvailability(item)}
                disabled={allDisabled}
                className="h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
              >
                {item.isAvailable ? "Deactivate" : "Reactivate"}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="destructive"
              onClick={() => onRequestDelete(item)}
              disabled={allDisabled || confirming}
              className="h-9 px-3"
            >
              Delete
            </Button>
          </div>

          {confirming ? (
            <AdminConfirmBar
              destructive
              message={`Delete "${item.itemName || "this item"}"? This cannot be undone.`}
              confirmLabel="Delete item"
              pending={busy === `delete:${item.id}`}
              onConfirm={onConfirmDelete}
              onCancel={onCancelDelete}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
