const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return currencyFormatter.format(amount);
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  // Backend delivery dates are calendar dates, not UTC timestamps. Formatting
  // them in UTC keeps the displayed day identical in every local timezone.
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(typeof value === "string" && DATE_ONLY_PATTERN.test(value)
      ? { timeZone: "UTC" }
      : {}),
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(typeof value === "string" && DATE_ONLY_PATTERN.test(value)
      ? { timeZone: "UTC" }
      : {}),
  }).format(date);
}

export function initials(name) {
  if (typeof name !== "string") {
    return "PH";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "PH";
  }

  return parts.map((part) => part[0].toUpperCase()).join("");
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
