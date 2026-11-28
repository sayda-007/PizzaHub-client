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
import { Button } from "@/components/ui/button";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES, ROLE_LABELS, useAuthorizedSession } from "@/lib/auth-client";
import { listAdminUsers, setAdminUserBlocked } from "@/lib/dashboard-client";
import { formatDate, initials } from "@/lib/format";

const PAGE_LIMIT = 12;
const EMPTY_FILTERS = Object.freeze({ search: "", role: "" });

const ROLE_OPTIONS = Object.freeze([
  { value: "", label: "All roles" },
  ...Object.values(ACCOUNT_ROLES).map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  })),
]);

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-10 w-full rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted";

function AdminUsersContent() {
  const { canLoad, session } = useAuthorizedSession([ACCOUNT_ROLES.ADMIN]);
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    let active = true;

    // Async data load: state updates happen after the request, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    listAdminUsers({ ...filters, page, limit: PAGE_LIMIT })
      .then((payload) => {
        if (!active) {
          return;
        }

        const list = Array.isArray(payload?.users) ? payload.users : [];
        setUsers(list);
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

        setUsers([]);
        setPagination(null);
        setError(friendlyApiError(requestError, "We couldn't load users."));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canLoad, filters, page, reloadKey]);

  function clearActionState() {
    setNotice("");
    setActionError("");
  }

  function applyFilters(next) {
    const normalized = {
      search: next.search.trim(),
      role: next.role,
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

  function requestBlock(user, blocked) {
    clearActionState();
    setConfirm({ id: user.id, name: user.name, blocked });
  }

  async function handleBlock(request) {
    clearActionState();
    setBusy(`block:${request.id}`);

    try {
      await setAdminUserBlocked(request.id, request.blocked);
      setNotice(
        request.blocked
          ? "User blocked. They cannot sign in until unblocked."
          : "User unblocked. They can sign in again.",
      );
      setConfirm(null);
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setActionError(friendlyApiError(requestError, "We couldn't update this account."));
    } finally {
      setBusy("");
    }
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
        <form
          onSubmit={handleSubmit}
          aria-label="Filter users"
          className="rounded-sm border border-line bg-surface p-5 sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="admin-user-search" className={labelClass}>
                Search
              </label>
              <input
                id="admin-user-search"
                type="search"
                value={draft.search}
                maxLength={100}
                placeholder="Name or email"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, search: event.target.value }))
                }
                className={controlClass}
              />
            </div>

            <div>
              <label htmlFor="admin-user-role" className={labelClass}>
                Role
              </label>
              <select
                id="admin-user-role"
                value={draft.role}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, role: event.target.value }))
                }
                className={controlClass}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-xs text-ink-muted">
              Admin accounts are protected from block changes.
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
          <DashboardLoading label="Loading users..." />
        ) : error ? null : users.length === 0 ? (
          <div className="space-y-4">
            <DashboardEmpty
              title="No users found"
              description={
                hasFilters
                  ? "No accounts match these filters. Try a different search or role."
                  : "There are no accounts to show yet."
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
              {users.map((user) => (
                <AdminUserCard
                  key={user.id}
                  user={user}
                  isSelf={String(user.id) === String(session?.user?.id)}
                  busy={busy}
                  confirming={confirm?.id === user.id ? confirm : null}
                  onRequestBlock={requestBlock}
                  onConfirmBlock={() => handleBlock(confirm)}
                  onCancelBlock={() => setConfirm(null)}
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

export default function AdminUsersManager() {
  return (
    <DashboardShell
      title="User directory"
      description="Find PizzaHub accounts, review subscription details, and manage access with block controls."
      allowedRoles={[ACCOUNT_ROLES.ADMIN]}
    >
      <AdminUsersContent />
    </DashboardShell>
  );
}

function AdminUserCard({
  user,
  isSelf,
  busy,
  confirming,
  onRequestBlock,
  onConfirmBlock,
  onCancelBlock,
}) {
  const isAdmin = user.role === ACCOUNT_ROLES.ADMIN;
  const shouldBlock = !user.isBlocked;
  const actionLabel = shouldBlock ? "Block" : "Unblock";
  const allDisabled = Boolean(busy);

  return (
    <article className="rounded-sm border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-charcoal"
          >
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-lg text-charcoal">
              {user.name || "Unnamed account"}
            </h3>
            <p className="break-all text-sm text-ink-muted">
              {user.email || "No email on file"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-line bg-muted px-2.5 py-0.5 text-xs font-semibold text-charcoal">
            {ROLE_LABELS[user.role] ?? user.role ?? "Unknown"}
          </span>
          {user.isBlocked ? (
            <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              Blocked
            </span>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-ink-muted">Business name</dt>
          <dd className="mt-0.5 font-medium text-charcoal">
            {user.businessName || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Subscription plan</dt>
          <dd className="mt-0.5 font-medium text-charcoal">
            {user.subscriptionPlan || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Subscription status</dt>
          <dd className="mt-1">
            <StatusBadge type="subscription" status={user.subscriptionStatus} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Subscription expires</dt>
          <dd className="mt-0.5 font-medium text-charcoal">
            {formatDate(user.subscriptionExpiresAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Joined</dt>
          <dd className="mt-0.5 font-medium text-charcoal">
            {formatDate(user.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button
          type="button"
          variant={shouldBlock ? "destructive" : "outline"}
          disabled={isAdmin || isSelf || allDisabled}
          onClick={() => onRequestBlock(user, shouldBlock)}
          className={
            shouldBlock
              ? "h-9 border-destructive/30 bg-destructive/10 px-3 text-destructive hover:bg-destructive/20"
              : "h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
          }
        >
          {actionLabel}
        </Button>
        {isSelf ? (
          <p className="text-xs text-ink-muted">You cannot block your own account.</p>
        ) : isAdmin ? (
          <p className="text-xs text-ink-muted">Admin accounts cannot be blocked.</p>
        ) : null}
      </div>

      {confirming ? (
        <AdminConfirmBar
          destructive={confirming.blocked}
          message={
            confirming.blocked
              ? `Block ${confirming.name || "this account"}? They will lose access until unblocked.`
              : `Unblock ${confirming.name || "this account"}? They will regain access.`
          }
          confirmLabel={confirming.blocked ? "Block user" : "Unblock user"}
          pending={busy === `block:${user.id}`}
          onConfirm={onConfirmBlock}
          onCancel={onCancelBlock}
        />
      ) : null}
    </article>
  );
}
