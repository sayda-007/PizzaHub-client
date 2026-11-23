import { cacheLife } from "next/cache";

import { DEFAULT_MENU_QUERY, normalizeMenuQuery } from "@/lib/menu-query";

const FALLBACK_BACKEND_URL = "https://pizzahub-server-xi.vercel.app";
const PUBLIC_MENU_PATH = "/api/menu";
const REQUEST_TIMEOUT_MS = 8000;

const UNAVAILABLE_MESSAGE =
  "We couldn't load the menu right now. Please try again shortly.";

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

async function getCachedPublicMenu(options) {
  "use cache";

  cacheLife("minutes");

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
