import { cacheLife } from "next/cache";

const FALLBACK_BACKEND_URL = "https://pizzahub-server-xi.vercel.app";
const PUBLIC_MENU_PATH = "/api/menu";
const MENU_REQUEST_LIMIT = 12;
const REQUEST_TIMEOUT_MS = 8000;

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: MENU_REQUEST_LIMIT,
  totalItems: 0,
  totalPages: 0,
});

const UNAVAILABLE_MESSAGE =
  "We couldn't load the menu right now. Please try again shortly.";

function backendOrigin() {
  const configured =
    typeof process.env.PIZZAHUB_BACKEND_URL === "string"
      ? process.env.PIZZAHUB_BACKEND_URL.trim()
      : "";

  return (configured || FALLBACK_BACKEND_URL).replace(/\/+$/, "");
}

function menuEndpoint() {
  const url = new URL(`${backendOrigin()}${PUBLIC_MENU_PATH}`);
  url.searchParams.set("limit", String(MENU_REQUEST_LIMIT));
  return url.toString();
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function safeImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

function normalizeItem(raw) {
  if (!isRecord(raw)) {
    return null;
  }

  const id = text(raw.id);
  const itemName = text(raw.itemName);
  const price = raw.price;

  if (!id || !itemName || !finiteNumber(price) || price < 0 || !Array.isArray(raw.images)) {
    return null;
  }

  const images = raw.images.map(safeImageUrl).filter(Boolean);
  const item = {
    id,
    itemName,
    category: text(raw.category),
    description: text(raw.description),
    price,
    location: text(raw.location),
    images,
    imageAlt: `${itemName} menu item`,
    createdAt: text(raw.createdAt),
  };

  if (typeof raw.updatedAt === "string") {
    item.updatedAt = raw.updatedAt;
  }

  return item;
}

function normalizePagination(raw) {
  if (!isRecord(raw)) {
    return null;
  }

  const { page, limit, totalItems, totalPages } = raw;

  if (![page, limit, totalItems, totalPages].every(finiteNumber)) {
    return null;
  }

  return { page, limit, totalItems, totalPages };
}

function unavailable() {
  return {
    status: "error",
    items: [],
    pagination: EMPTY_PAGINATION,
    message: UNAVAILABLE_MESSAGE,
  };
}

/**
 * Server-only public menu fetch. Both the homepage preview and the full menu
 * route call this with the same arguments, so the cached result is shared.
 */
export async function getPublicMenu() {
  "use cache";

  cacheLife("minutes");

  try {
    const response = await fetch(menuEndpoint(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return unavailable();
    }

    const payload = await response.json();

    if (!isRecord(payload) || !Array.isArray(payload.items)) {
      return unavailable();
    }

    const pagination = normalizePagination(payload.pagination);

    if (!pagination) {
      return unavailable();
    }

    const items = [];

    for (const raw of payload.items) {
      const item = normalizeItem(raw);

      if (!item) {
        return unavailable();
      }

      items.push(item);
    }

    return { status: "ok", items, pagination, message: null };
  } catch {
    return unavailable();
  }
}
