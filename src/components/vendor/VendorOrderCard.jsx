import { CalendarDays, MapPin, MessageSquareText } from "lucide-react";

import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { itemNameFromSnapshot } from "@/components/vendor/vendor-data";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/status";

const labelClass = "text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";

export default function VendorOrderCard({ order, busy, onDecision }) {
  const isPending = order.status === ORDER_STATUSES.PENDING;

  return (
    <article className="rounded-sm border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-xl text-charcoal">
            {itemNameFromSnapshot(order.itemSnapshot)}
          </h2>
          <p className="mt-1 break-all text-xs text-ink-muted">
            Order {order.id} · Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className={labelClass}>Delivery date</dt>
          <dd className="mt-1.5 inline-flex items-center gap-1.5 text-charcoal">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
            {formatDate(order.deliveryDate)}
          </dd>
        </div>

        <div>
          <dt className={labelClass}>Order total</dt>
          <dd className="mt-1.5 font-semibold text-charcoal">{formatPrice(order.price)}</dd>
        </div>

        <div className="sm:col-span-2">
          <dt className={labelClass}>Delivery address</dt>
          <dd className="mt-1.5 flex items-start gap-1.5 text-charcoal">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-muted" />
            <span className="break-words">{order.deliveryAddress || "Address not provided"}</span>
          </dd>
        </div>

        {order.additionalMessage ? (
          <div className="sm:col-span-2">
            <dt className={labelClass}>Customer note</dt>
            <dd className="mt-1.5 flex items-start gap-1.5 text-charcoal">
              <MessageSquareText
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-ink-muted"
              />
              <span className="break-words">{order.additionalMessage}</span>
            </dd>
          </div>
        ) : null}
      </dl>

      {isPending ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => onDecision(order.id, ORDER_STATUSES.ACCEPTED)}
            className="h-9 bg-olive px-3 text-paper hover:bg-olive/90"
          >
            {busy ? "Updating..." : "Accept order"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onDecision(order.id, ORDER_STATUSES.REJECTED)}
            className="h-9 border-destructive/40 bg-paper px-3 text-destructive hover:bg-destructive/5"
          >
            {busy ? "Updating..." : "Reject order"}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
