/** Shared presentation metadata for server-owned statuses. */

export const ORDER_STATUSES = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

export const MENU_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  INACTIVE: "inactive",
});

export const SUBSCRIPTION_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
});

const STATUS_TONES = Object.freeze({
  neutral: "border-line bg-muted text-ink-muted",
  warning: "border-orange/30 bg-orange/10 text-[#8a4a25]",
  success: "border-olive/30 bg-olive/10 text-olive",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-tomato/25 bg-tomato/10 text-tomato",
});

const ORDER_STATUS_META = Object.freeze({
  [ORDER_STATUSES.PENDING]: { label: "Pending", tone: "warning" },
  [ORDER_STATUSES.ACCEPTED]: { label: "Accepted", tone: "success" },
  [ORDER_STATUSES.REJECTED]: { label: "Rejected", tone: "danger" },
  [ORDER_STATUSES.CANCELLED]: { label: "Cancelled", tone: "neutral" },
});

const MENU_STATUS_META = Object.freeze({
  [MENU_STATUSES.PENDING]: { label: "Awaiting review", tone: "warning" },
  [MENU_STATUSES.APPROVED]: { label: "Approved", tone: "success" },
  [MENU_STATUSES.REJECTED]: { label: "Rejected", tone: "danger" },
  [MENU_STATUSES.INACTIVE]: { label: "Inactive", tone: "neutral" },
});

const SUBSCRIPTION_STATUS_META = Object.freeze({
  [SUBSCRIPTION_STATUSES.ACTIVE]: { label: "Active", tone: "success" },
  [SUBSCRIPTION_STATUSES.INACTIVE]: { label: "Inactive", tone: "neutral" },
  [SUBSCRIPTION_STATUSES.PAST_DUE]: { label: "Past due", tone: "danger" },
  [SUBSCRIPTION_STATUSES.CANCELED]: { label: "Canceled", tone: "neutral" },
});

export function orderStatusMeta(status) {
  return ORDER_STATUS_META[status] ?? { label: status || "Unknown", tone: "neutral" };
}

export function menuStatusMeta(status) {
  return MENU_STATUS_META[status] ?? { label: status || "Unknown", tone: "neutral" };
}

export function subscriptionStatusMeta(status) {
  return SUBSCRIPTION_STATUS_META[status] ?? { label: status || "Unknown", tone: "neutral" };
}

export function statusBadgeClass(meta) {
  return STATUS_TONES[meta?.tone] ?? STATUS_TONES.neutral;
}

/** Ordered customer-facing progress for a single order. */
export function orderTimeline(status) {
  const steps = [
    { key: "placed", label: "Order placed" },
    { key: "review", label: "Kitchen review" },
    { key: "decision", label: "Decision" },
  ];

  if (status === ORDER_STATUSES.PENDING) {
    return steps;
  }

  if (status === ORDER_STATUSES.ACCEPTED) {
    return steps;
  }

  if (status === ORDER_STATUSES.REJECTED) {
    return steps.map((step, index) => ({
      ...step,
      label: index === steps.length - 1 ? "Rejected" : step.label,
    }));
  }

  return steps.map((step, index) => ({
    ...step,
    label: index === steps.length - 1 ? "Cancelled" : step.label,
  }));
}

export function timelineState(status, index) {
  const decisionIndex = 2;

  if (status === ORDER_STATUSES.PENDING) {
    return index <= 1 ? "complete" : "pending";
  }

  if (status === ORDER_STATUSES.CANCELLED) {
    return index === 0 ? "complete" : "cancelled";
  }

  if (status === ORDER_STATUSES.REJECTED) {
    return index === decisionIndex ? "rejected" : "complete";
  }

  return index <= decisionIndex ? "complete" : "pending";
}
