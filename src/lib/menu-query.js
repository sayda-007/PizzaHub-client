/**
 * Client-side parsing for the public menu URL.
 *
 * These limits and values mirror the backend's public menu validator. This
 * module never calls the backend and never invents a filter the API cannot
 * apply; it only decides which supported query values are safe to forward.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const DEFAULT_SORT = "newest";

const MAX_SEARCH_LENGTH = 100;
const MAX_LOCATION_LENGTH = 120;
const MAX_PAGE = 10_000;
const MAX_LIMIT = 50;

/** Categories are an enum in the backend, not values read from the current page. */
export const MENU_CATEGORIES = Object.freeze([
  "Classic Pizzas",
  "Vegetarian Pizzas",
  "Meat Lovers",
  "Specialty / Gourmet Pizzas",
  "Sides & Appetizers",
  "Beverages & Desserts",
]);

export const MENU_SORT_OPTIONS = Object.freeze([
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
]);

export const DEFAULT_MENU_QUERY = Object.freeze({
  search: "",
  category: "",
  location: "",
  sort: DEFAULT_SORT,
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
});

const SORT_VALUES = new Set(MENU_SORT_OPTIONS.map((option) => option.value));
const CATEGORY_LOOKUP = new Map(
  MENU_CATEGORIES.map((category) => [category.toLowerCase(), category]),
);

function firstValue(value) {
  if (Array.isArray(value)) {
    return firstValue(value[0]);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function cleanText(value, maxLength) {
  return firstValue(value)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function positiveInteger(value, fallback, max) {
  const raw = firstValue(value);

  if (!/^\d+$/.test(raw)) {
    return fallback;
  }

  const parsed = Number(raw);

  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= max
    ? parsed
    : fallback;
}

/**
 * Convert Next.js `searchParams` into the exact shape supported by the public
 * API. Empty and invalid values become defaults so no unsupported or malformed
 * query is ever sent to the server.
 */
export function normalizeMenuQuery(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_MENU_QUERY };
  }

  const search = cleanText(value.search, MAX_SEARCH_LENGTH);
  const requestedCategory = cleanText(value.category, MAX_LOCATION_LENGTH);
  const category = CATEGORY_LOOKUP.get(requestedCategory.toLowerCase()) ?? "";
  const location = cleanText(value.location, MAX_LOCATION_LENGTH);
  const requestedSort = cleanText(value.sort, 20);
  const sort = SORT_VALUES.has(requestedSort) ? requestedSort : DEFAULT_SORT;
  const page = positiveInteger(value.page, DEFAULT_PAGE, MAX_PAGE);
  const limit = positiveInteger(value.limit, DEFAULT_LIMIT, MAX_LIMIT);

  return { search, category, location, sort, page, limit };
}

/**
 * MongoDB location matching is exact and case-sensitive. When the API has told
 * us the real stored value, use it so a URL such as `location=downtown` still
 * selects the actual `Downtown` kitchen instead of silently returning nothing.
 */
export function canonicalizeMenuLocation(value, knownLocations = []) {
  const location = cleanText(value, MAX_LOCATION_LENGTH);

  if (!location) {
    return "";
  }

  const known = knownLocations.find(
    (option) =>
      typeof option === "string" &&
      option.trim().toLowerCase() === location.toLowerCase(),
  );

  return known ? known.trim() : location;
}

/** Filter selections only; pagination is not a filter the customer chose. */
export function hasActiveMenuFilters(query) {
  const normalized = normalizeMenuQuery(query);

  return (
    Boolean(normalized.search) ||
    Boolean(normalized.category) ||
    Boolean(normalized.location) ||
    normalized.sort !== DEFAULT_SORT
  );
}

export function activeMenuFilters(query) {
  const normalized = normalizeMenuQuery(query);
  const filters = [];

  if (normalized.search) {
    filters.push({
      key: "search",
      label: `Search: ${normalized.search}`,
      href: filterMenuHref(normalized, { search: "" }),
    });
  }

  if (normalized.category) {
    filters.push({
      key: "category",
      label: `Category: ${normalized.category}`,
      href: filterMenuHref(normalized, { category: "" }),
    });
  }

  if (normalized.location) {
    filters.push({
      key: "location",
      label: `Location: ${normalized.location}`,
      href: filterMenuHref(normalized, { location: "" }),
    });
  }

  if (normalized.sort !== DEFAULT_SORT) {
    const sort = MENU_SORT_OPTIONS.find(
      (option) => option.value === normalized.sort,
    );

    filters.push({
      key: "sort",
      label: `Sort: ${sort?.label ?? normalized.sort}`,
      href: filterMenuHref(normalized, { sort: DEFAULT_SORT }),
    });
  }

  return filters;
}

/** Build canonical `/menu` URLs that preserve every active query value. */
export function menuHref(query, overrides = {}) {
  const merged = { ...normalizeMenuQuery(query), ...overrides };
  const next = normalizeMenuQuery(merged);
  const params = new URLSearchParams();

  if (next.search) {
    params.set("search", next.search);
  }

  if (next.category) {
    params.set("category", next.category);
  }

  if (next.location) {
    params.set("location", next.location);
  }

  if (next.sort !== DEFAULT_SORT) {
    params.set("sort", next.sort);
  }

  if (next.limit !== DEFAULT_LIMIT) {
    params.set("limit", String(next.limit));
  }

  if (next.page !== DEFAULT_PAGE) {
    params.set("page", String(next.page));
  }

  const search = params.toString();

  return search ? `/menu?${search}` : "/menu";
}

/** Changing any filter starts a fresh result set on page 1. */
export function filterMenuHref(query, overrides = {}) {
  return menuHref(query, { ...overrides, page: DEFAULT_PAGE });
}
