"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import FormMessage from "@/components/auth/FormMessage";
import { DashboardError, DashboardLoading } from "@/components/dashboard/DashboardStates";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Pagination from "@/components/dashboard/Pagination";
import { Button } from "@/components/ui/button";
import VendorMenuCard from "@/components/vendor/VendorMenuCard";
import VendorMenuForm from "@/components/vendor/VendorMenuForm";
import {
  normalizePagination,
  paginationControl,
  totalSummary,
} from "@/components/vendor/vendor-data";
import { friendlyApiError } from "@/lib/api-client";
import { ACCOUNT_ROLES, authClient, getSessionAccountRole } from "@/lib/auth-client";
import {
  deleteVendorMenu,
  listVendorMenu,
  toggleVendorMenuAvailability,
} from "@/lib/dashboard-client";
import { isValidMenuId } from "@/lib/menu-form-validation";

const PAGE_SIZE = 9;

export default function VendorMenuPage() {
  const { data: session } = authClient.useSession();
  const isVendor = getSessionAccountRole(session) === ACCOUNT_ROLES.VENDOR;

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalItems: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
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

    listVendorMenu({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) {
          return;
        }

        setItems(Array.isArray(result?.items) ? result.items : []);
        setPagination(normalizePagination(result?.pagination));
      })
      .catch((loadError) => {
        if (active) {
          setError(friendlyApiError(loadError, "We couldn't load your menu items."));
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
  }, [isVendor, page, reloadKey]);

  function handleFormDone(message) {
    setShowAdd(false);
    setEditingId("");
    setActionError("");
    setSuccess(message);
    setPage(1);
    refresh();
  }

  async function handleToggle(id) {
    if (!isValidMenuId(id)) {
      setActionError("That item has an invalid identifier and cannot be changed.");
      return;
    }

    setBusyId(id);
    setActionError("");
    setSuccess("");

    try {
      await toggleVendorMenuAvailability(id);
      setSuccess("Availability updated.");
      refresh();
    } catch (toggleError) {
      setActionError(friendlyApiError(toggleError, "We couldn't change that item's availability."));
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(id) {
    if (!isValidMenuId(id)) {
      setActionError("That item has an invalid identifier and cannot be deleted.");
      return;
    }

    setBusyId(id);
    setActionError("");
    setSuccess("");

    try {
      await deleteVendorMenu(id);
      setDeletingId("");
      setSuccess("Menu item deleted.");

      if (items.length === 1 && page > 1) {
        setPage(1);
      } else {
        refresh();
      }
    } catch (deleteError) {
      setActionError(friendlyApiError(deleteError, "We couldn't delete that menu item."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <DashboardShell
      title="Menu items"
      description="Add pizzas and sides, keep availability up to date, and follow each item through admin review."
      allowedRoles={[ACCOUNT_ROLES.VENDOR]}
      actions={
        <>
          <Button
            type="button"
            disabled={Boolean(busyId)}
            onClick={() => {
              setEditingId("");
              setSuccess("");
              setShowAdd((current) => !current);
            }}
            className="h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
          >
            {showAdd ? "Close add form" : "Add item"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 border-line bg-paper px-4 text-charcoal hover:bg-muted"
          >
            <Link href="/vendor/subscription">Manage plan</Link>
          </Button>
        </>
      }
    >
      {isVendor ? (
        <div className="space-y-6">
          <FormMessage tone="success">{success}</FormMessage>
          <FormMessage>{actionError}</FormMessage>

          {showAdd ? (
            <section className="rounded-sm border border-line bg-surface p-5 sm:p-7">
              <h2 className="font-heading text-2xl text-charcoal">Add a menu item</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                New items are sent to an administrator for review. They are created available, so
                an approved item can appear publicly right away; switch it off here if you are not
                ready to sell it.
              </p>
              <VendorMenuForm onDone={handleFormDone} onCancel={() => setShowAdd(false)} />
            </section>
          ) : null}

          {error ? <DashboardError message={error} onRetry={refresh} /> : null}
          {loading ? <DashboardLoading label="Loading your menu items..." /> : null}

          {!loading && !error && items.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line bg-surface px-6 py-12 text-center">
              <h2 className="font-heading text-xl text-charcoal">No menu items yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                Add your first item and it will appear here while it waits for review.
              </p>
              <Button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-5 h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
              >
                Add your first item
              </Button>
            </div>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <VendorMenuCard
                    key={item.id}
                    item={item}
                    busy={busyId === item.id}
                    editing={editingId === item.id}
                    confirming={deletingId === item.id}
                    editForm={
                      editingId === item.id ? (
                        <VendorMenuForm
                          key={`edit-${item.id}`}
                          item={item}
                          onDone={handleFormDone}
                          onCancel={() => setEditingId("")}
                        />
                      ) : null
                    }
                    onEdit={() => {
                      setActionError("");
                      setSuccess("");
                      setDeletingId("");
                      setEditingId(item.id);
                    }}
                    onToggle={() => handleToggle(item.id)}
                    onDelete={() => {
                      setActionError("");
                      setSuccess("");
                      setEditingId("");
                      setDeletingId(item.id);
                    }}
                    onConfirmDelete={() => handleDelete(item.id)}
                    onCancelDelete={() => setDeletingId("")}
                  />
                ))}
              </div>

              <p className="text-xs text-ink-muted" aria-live="polite">
                {totalSummary(pagination.totalItems)}
              </p>
              {pagination.totalItems === null ? (
                <p className="text-xs text-ink-muted">
                  The server did not include a total count with your menu items.
                </p>
              ) : null}
              <Pagination
                pagination={paginationControl(pagination)}
                disabled={loading || Boolean(busyId)}
                onChange={(nextPage) => {
                  setEditingId("");
                  setDeletingId("");
                  setPage(nextPage);
                }}
              />
            </>
          ) : null}

          <p className="text-xs leading-relaxed text-ink-muted">
            The Free plan allows 3 active menu items. Limits and plan changes are decided by the
            backend;{" "}
            <Link
              href="/vendor/subscription"
              className="font-semibold text-tomato underline underline-offset-4"
            >
              view your subscription
            </Link>
            .
          </p>
        </div>
      ) : null}
    </DashboardShell>
  );
}
