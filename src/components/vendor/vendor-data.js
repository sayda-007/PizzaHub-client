/**
 * Presentation-only helpers for the vendor area.
 *
 * These helpers never invent values: when the backend omits a number or a
 * status, the UI says so instead of substituting a plausible-looking value.
 */

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Menu endpoints have used both `totalItems` and `total` for the same value. */
export function normalizePagination(pagination) {
  const raw = pagination && typeof pagination === "object" ? pagination : {};
  const totalItems = finiteNumber(raw.totalItems ?? raw.total);
  const limit = finiteNumber(raw.limit);
  const page = finiteNumber(raw.page) ?? 1;
  const reportedPages = finiteNumber(raw.totalPages);
  const totalPages =
    reportedPages ??
    (totalItems !== null && limit !== null && limit > 0
      ? Math.ceil(totalItems / limit)
      : 0);

  return { page, totalPages, totalItems, limit };
}

/** The shared Pagination component reads `totalItems` and hides itself at 0. */
export function paginationControl(pagination) {
  return {
    page: pagination?.page ?? 1,
    totalPages: pagination?.totalPages ?? 0,
    totalItems: pagination?.totalItems ?? 0,
  };
}

export function totalSummary(totalItems) {
  return totalItems === null || totalItems === undefined
    ? "Total not available"
    : `${totalItems} total`;
}

/** Only backend-provided http(s) URLs or same-origin paths may be displayed. */
export function safeImageSrc(value) {
  if (typeof value !== "string") {
    return "";
  }

  const src = value.trim();

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  if (src.startsWith("/") && !src.startsWith("//")) {
    return src;
  }

  return "";
}

export function planLabel(plan) {
  if (typeof plan !== "string" || !plan.trim()) {
    return "Plan not available";
  }

  return plan
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

/** Stripe is optional; a 503 means checkout must not be offered as if it works. */
export function isSubscriptionUnconfigured(error) {
  if (error?.status === 503) {
    return true;
  }

  const message = typeof error?.message === "string" ? error.message : "";
  return /not configured|not available|disabled|unavailable/i.test(message);
}

export function itemNameFromSnapshot(snapshot) {
  if (typeof snapshot === "string" && snapshot.trim()) {
    return snapshot.trim();
  }

  if (snapshot && typeof snapshot === "object") {
    const name = snapshot.itemName ?? snapshot.name;

    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return "Menu item";
}
