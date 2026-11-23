import { authClient } from "@/lib/auth-client";

const ORDER_PATH = "/api/orders";

export class OrderApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "OrderApiError";
    this.code = details.code ?? "";
    this.status = details.status ?? null;
    this.fields = details.fields ?? {};
  }
}

function friendlyMessage(payload, status) {
  const code = typeof payload?.code === "string" ? payload.code : "";
  const serverMessage =
    typeof payload?.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : "";

  if (code === "ORDER_ALREADY_ACTIVE") {
    return "An active order already exists for this item and delivery date. Cancel it before placing another.";
  }

  if (code === "MENU_ITEM_NOT_ORDERABLE") {
    return "This item is no longer available to order.";
  }

  if (code === "MENU_ITEM_NOT_FOUND") {
    return "This menu item no longer exists.";
  }

  if (status === 401 || code === "UNAUTHORIZED") {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403 || code === "FORBIDDEN") {
    return serverMessage || "You do not have permission to place this order.";
  }

  if (status === 429 || code === "RATE_LIMITED") {
    return "Too many requests. Please wait a moment and try again.";
  }

  return serverMessage || "We couldn't place your order. Please try again.";
}

function fieldErrors(payload) {
  const fields = {};

  if (!Array.isArray(payload?.details)) {
    return fields;
  }

  for (const detail of payload.details) {
    if (
      detail &&
      typeof detail.field === "string" &&
      typeof detail.message === "string"
    ) {
      fields[detail.field] = detail.message;
    }
  }

  return fields;
}

/** Better Auth v1.7.27 exposes the jwt() plugin's GET /api/auth/token as token(). */
async function getBearerToken() {
  let result;

  try {
    result = await authClient.token();
  } catch {
    throw new OrderApiError("We couldn't verify your session. Please sign in again.");
  }

  if (result?.error || typeof result?.data?.token !== "string" || !result.data.token) {
    throw new OrderApiError("We couldn't verify your session. Please sign in again.", {
      status: result?.error?.status ?? null,
    });
  }

  return result.data.token;
}

export async function createOrder(payload) {
  const token = await getBearerToken();

  let response;

  try {
    response = await fetch(ORDER_PATH, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OrderApiError("We couldn't reach the ordering service. Please try again.");
  }

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new OrderApiError(friendlyMessage(body, response.status), {
      code: body?.code,
      status: response.status,
      fields: fieldErrors(body),
    });
  }

  const order = body?.order;

  if (!order || typeof order !== "object") {
    throw new OrderApiError("Your order may have been placed, but we couldn't read the confirmation.");
  }

  return order;
}
