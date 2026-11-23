"use client";

import { useId } from "react";

import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import VendorMenuThumbnail from "@/components/vendor/VendorMenuThumbnail";
import { formatDate, formatPrice } from "@/lib/format";

const outlineButton =
  "h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted";

export default function VendorMenuCard({
  item,
  busy,
  editing,
  confirming,
  editForm,
  onEdit,
  onToggle,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}) {
  const confirmId = useId();
  const image = Array.isArray(item.images) ? item.images[0] : undefined;
  const available = Boolean(item.isAvailable);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border border-line bg-surface">
      <VendorMenuThumbnail src={image} alt={`${item.itemName ?? "Menu item"} photo`} />

      <div className="flex flex-1 flex-col p-5">
        {editing ? (
          <>
            <h3 className="font-heading text-xl text-charcoal">Edit {item.itemName}</h3>
            <div className="mt-3">{editForm}</div>
          </>
        ) : (
          <>
            {item.category ? (
              <p className="text-xs font-semibold tracking-[0.16em] text-olive uppercase">
                {item.category}
              </p>
            ) : null}

            <h3 className="mt-2 font-heading text-xl text-charcoal">
              {item.itemName ?? "Untitled item"}
            </h3>

            {item.description ? (
              <p className="mt-2 text-sm leading-relaxed break-words text-ink-muted">
                {item.description}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge type="menu" status={item.status} />
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  available
                    ? "border-olive/30 bg-olive/10 text-olive"
                    : "border-line bg-muted text-ink-muted"
                }`}
              >
                {available ? "Available" : "Unavailable"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="font-semibold text-charcoal">{formatPrice(item.price)}</span>
              {item.location ? <span className="text-ink-muted">{item.location}</span> : null}
              <span className="text-xs text-ink-muted">Added {formatDate(item.createdAt)}</span>
            </div>

            {confirming ? (
              <div
                role="alertdialog"
                aria-labelledby={`${confirmId}-title`}
                aria-describedby={`${confirmId}-description`}
                className="mt-auto rounded-sm border border-destructive/30 bg-destructive/5 p-3"
              >
                <p id={`${confirmId}-title`} className="text-sm font-semibold text-charcoal">
                  Delete this item?
                </p>
                <p id={`${confirmId}-description`} className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {item.itemName} will be removed from your menu. This cannot be undone.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={onConfirmDelete}
                    className="h-9 bg-destructive px-3 text-paper hover:bg-destructive/90"
                  >
                    {busy ? "Deleting..." : "Yes, delete"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={onCancelDelete}
                    className={outlineButton}
                  >
                    Keep item
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={onEdit}
                  className={outlineButton}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={onToggle}
                  className={outlineButton}
                >
                  {available ? "Mark unavailable" : "Mark available"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
