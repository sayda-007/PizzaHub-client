import { cacheLife } from "next/cache";

import { DEFAULT_MENU_QUERY, normalizeMenuQuery } from "@/lib/menu-query";

const FALLBACK_BACKEND_URL = "https://pizzahub-server-xi.vercel.app";
const PUBLIC_MENU_PATH = "/api/menu";
const REQUEST_TIMEOUT_MS = 8000;

const UNAVAILABLE_MESSAGE =
  "We couldn't load the menu right now. Please try again shortly.";

function backendOrigin() {
  const configured =
    typeof process.env.PIZZAHUB_BACKEND_URL === "string"
      ? process.env.PIZZAHUB_BACKEND_URL.trim()
      : "";

  return (configured || FALLBACK_BACKEND_URL).replace(/\/+$/, "");
}

function menuEndpoint(options) {
  const url = new URL(`${backendOrigin()}${PUBLIC_MENU_PATH}`);
  const params = new URLSearchParams();

  // The backend rejects empty text values and unknown keys. Only forward the
  // six documented public parameters, and omit optional text when it is empty.
  if (options.search) {
    params.set("search", options.search);
  }

  if (options.category) {
    params.set("category", options.category);
  }

  if (options.location) {
    params.set("location", options.location);
  }

  params.set("sort", options.sort);
  params.set("page", String(options.page));
  params.set("limit", String(options.limit));
  url.search = params.toString();

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

function unavailable(options) {
  return {
    status: "error",
    items: [],
    pagination: {
      page: options.page,
      limit: options.limit,
      totalItems: 0,
      totalPages: 0,
    },
    message: UNAVAILABLE_MESSAGE,
  };
}

/**
 * Server-only public menu fetch. The homepage calls this with no arguments,
 * while `/menu` passes its normalized query. Normalizing outside the cached
 * scope means both callers share one entry for the default view, and every
 * other search/filter/sort/page/limit combination gets its own cache entry.
 */
export async function getPublicMenu(query = DEFAULT_MENU_QUERY) {
  const options = normalizeMenuQuery(query);

  return getCachedPublicMenu(options);
}

async function getCachedPublicMenu(options) {
  "use cache";

  cacheLife("minutes");

  try {
    const response = await fetch(menuEndpoint(options), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return unavailable(options);
    }

    const payload = await response.json();

    if (!isRecord(payload) || !Array.isArray(payload.items)) {
      return unavailable(options);
    }

    const pagination = normalizePagination(payload.pagination);

    if (!pagination) {
      return unavailable(options);
    }

    const items = [];

    for (const raw of payload.items) {
      const item = normalizeItem(raw);

      if (!item) {
        return unavailable(options);
      }

      items.push(item);
    }

    return { status: "ok", items, pagination, message: null };
  } catch {
    return unavailable(options);
  }
}
