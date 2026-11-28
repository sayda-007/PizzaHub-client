import { cacheLife, cacheTag } from "next/cache";

import { DEFAULT_MENU_QUERY, normalizeMenuQuery } from "@/lib/menu-query";
import { PUBLIC_MENU_CACHE_TAG } from "@/lib/public-menu-cache";

const FALLBACK_BACKEND_URL = "https://pizzahub-server-xi.vercel.app";
const PUBLIC_MENU_PATH = "/api/menu";
const REQUEST_TIMEOUT_MS = 15000;
const LOCATION_PAGE_SIZE = 50;
const LOCATION_PAGE_CONCURRENCY = 4;
const ITEM_PAGE_SIZE = 50;
const ITEM_PAGE_CONCURRENCY = 4;
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

const UNAVAILABLE_MESSAGE =
  "We couldn't load the menu right now. Please try again shortly.";
const ITEM_NOT_FOUND_MESSAGE =
  "We couldn't find that menu item. It may have been removed.";

class PublicMenuError extends Error {
  constructor(stage, safeMessage, details = {}) {
    super(safeMessage);
    this.name = "PublicMenuError";
    this.stage = stage;
    this.status = details.status ?? null;
    this.causeName = details.causeName ?? null;
    this.itemIndex = details.itemIndex ?? null;
  }
}

/**
 * Resolve only an origin from the configured URL. This accepts a bare origin,
 * an origin with a trailing slash, or an accidentally supplied `/api/menu`
 * path without ever producing a duplicated API path.
 */
function backendOrigin() {
  const configured =
    typeof process.env.PIZZAHUB_BACKEND_URL === "string"
      ? process.env.PIZZAHUB_BACKEND_URL.trim()
      : "";
  const candidate = configured || FALLBACK_BACKEND_URL;
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate);

  let parsed;

  try {
    parsed = new URL(hasScheme ? candidate : `https://${candidate}`);
  } catch (error) {
    throw new PublicMenuError("endpoint", "The backend URL could not be parsed.", {
      causeName: error?.name ?? "UnknownError",
    });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new PublicMenuError("endpoint", "The backend URL protocol is unsupported.");
  }

  return parsed.origin;
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
 * Log only diagnostic metadata: never the configured URL, headers, or the
 * user's search/category/location values.
 */
function logMenuFailure(error) {
  const known = error instanceof PublicMenuError;

  console.error("[public-menu] request failed", {
    stage: known ? error.stage : "unexpected",
    httpStatus: known ? error.status : null,
    errorName: error?.name ?? "UnknownError",
    causeName: known ? error.causeName : null,
    itemIndex: known ? error.itemIndex : null,
    message: known
      ? error.message
      : "Unexpected error while loading the public menu.",
  });
}

/**
 * Server-only public menu fetch. The homepage calls this with no arguments,
 * while `/menu` passes its normalized query. Normalizing outside the cached
 * scope means both callers share one entry for the default view, and every
 * other search/filter/sort/page/limit combination gets its own cache entry.
 *
 * The cached function below returns only successful, validated results. Any
 * failure throws, so a temporary outage is never cached as the normal empty
 * menu response; this outer handler owns the friendly unavailable state.
 */
export async function getPublicMenu(query = DEFAULT_MENU_QUERY) {
  const options = normalizeMenuQuery(query);

  try {
    return await getCachedPublicMenu(options);
  } catch (error) {
    logMenuFailure(error);
    return unavailable(options);
  }
}

/**
 * Location values can only come from real menu items; the public API has no
 * separate locations endpoint. Read every page of the unfiltered menu so a
 * location that appears only after the first 50 items is still offered.
 *
 * Each page uses the same cached fetch as the customer menu, with a distinct
 * page argument. A small worker pool keeps concurrent requests bounded. Any
 * failed page rejects the whole collection; the catch below deliberately
 * returns no options rather than presenting a partial list as complete. It
 * stays quiet because the customer-facing menu request owns the logged error
 * and error state.
 */
export async function getMenuLocations() {
  try {
    const locations = new Map();

    function addLocations(items) {
      for (const item of items) {
        const location = item.location;

        if (!location) {
          continue;
        }

        const key = location.toLowerCase();
        const existing = locations.get(key);

        // Keep one stable spelling when the backend contains casing variants.
        if (!existing || location < existing) {
          locations.set(key, location);
        }
      }
    }

    async function fetchPage(page) {
      const menu = await getCachedPublicMenu({
        ...DEFAULT_MENU_QUERY,
        page,
        limit: LOCATION_PAGE_SIZE,
      });

      addLocations(menu.items);
      return menu.pagination.totalPages;
    }

    const totalPages = await fetchPage(1);

    if (totalPages > 1) {
      let nextPage = 2;
      const workerCount = Math.min(
        LOCATION_PAGE_CONCURRENCY,
        totalPages - 1,
      );

      async function worker() {
        while (nextPage <= totalPages) {
          const page = nextPage;
          nextPage += 1;
          await fetchPage(page);
        }
      }

      await Promise.all(
        Array.from({ length: workerCount }, () => worker()),
      );
    }

    return [...locations.values()].sort((left, right) =>
      left.localeCompare(right),
    );
  } catch {
    return [];
  }
}

/**
 * The backend has no public GET /api/menu/:id route. Its public list already
 * excludes hidden items, so scan those same cached pages to resolve a detail
 * URL without exposing private fields or inventing an endpoint.
 */
export async function getPublicMenuItem(id) {
  const itemId = typeof id === "string" ? id.trim().toLowerCase() : "";

  if (!OBJECT_ID_PATTERN.test(itemId)) {
    return { status: "missing", item: null, message: ITEM_NOT_FOUND_MESSAGE };
  }

  try {
    function findMatch(items) {
      return items.find((item) => item.id.toLowerCase() === itemId) ?? null;
    }

    function pageOptions(page) {
      return { ...DEFAULT_MENU_QUERY, page, limit: ITEM_PAGE_SIZE };
    }

    const firstPage = await getCachedPublicMenu(pageOptions(1));
    const firstMatch = findMatch(firstPage.items);

    if (firstMatch) {
      return { status: "ok", item: firstMatch, message: null };
    }

    const totalPages = firstPage.pagination.totalPages;

    if (totalPages <= 1) {
      return { status: "missing", item: null, message: ITEM_NOT_FOUND_MESSAGE };
    }

    let nextPage = 2;
    let match = null;

    async function worker() {
      while (!match && nextPage <= totalPages) {
        const page = nextPage;
        nextPage += 1;
        const result = await getCachedPublicMenu(pageOptions(page));
        match = findMatch(result.items);
      }
    }

    const workerCount = Math.min(ITEM_PAGE_CONCURRENCY, totalPages - 1);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (!match) {
      return { status: "missing", item: null, message: ITEM_NOT_FOUND_MESSAGE };
    }

    return { status: "ok", item: match, message: null };
  } catch (error) {
    logMenuFailure(error);
    return { status: "error", item: null, message: UNAVAILABLE_MESSAGE };
  }
}

async function getCachedPublicMenu(options) {
  "use cache";

  cacheLife("minutes");
  cacheTag(PUBLIC_MENU_CACHE_TAG);

  let response;

  try {
    response = await fetch(menuEndpoint(options), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new PublicMenuError("fetch", "The public menu request failed.", {
      causeName: error?.name ?? "UnknownError",
    });
  }

  if (!response.ok) {
    throw new PublicMenuError(
      "http",
      "The backend returned an unsuccessful HTTP status.",
      { status: response.status },
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    throw new PublicMenuError("parse_json", "The menu response was not valid JSON.", {
      causeName: error?.name ?? "UnknownError",
    });
  }

  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new PublicMenuError(
      "payload_shape",
      "The menu response had an unexpected structure.",
    );
  }

  const pagination = normalizePagination(payload.pagination);

  if (!pagination) {
    throw new PublicMenuError(
      "pagination",
      "The menu response had invalid pagination fields.",
    );
  }

  const items = [];

  for (let index = 0; index < payload.items.length; index += 1) {
    const item = normalizeItem(payload.items[index]);

    if (!item) {
      throw new PublicMenuError(
        "item",
        "The menu response contained an invalid item.",
        { itemIndex: index },
      );
    }

    items.push(item);
  }

  return { status: "ok", items, pagination, message: null };
}
