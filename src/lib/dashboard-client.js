import { apiRequest, apiUpload } from "@/lib/api-client";

/** Build a query string from scalar values only; empty filters are omitted. */
function queryString(values = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      // Backend text validators reject control characters. Strip them here so a
      // pasted character cannot make an otherwise valid filter request fail.
      const clean = String(value).replace(/[\u0000-\u001F\u007F]/g, "").trim();

      if (clean) {
        params.set(key, clean);
      }
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

/* -------------------------------- Profile -------------------------------- */

export function getProfile() {
  return apiRequest("/api/users/me");
}

export function updateProfile(payload) {
  return apiRequest("/api/users/me", { method: "PATCH", body: payload });
}

/* ----------------------------- Customer orders ---------------------------- */

export function listCustomerOrders(options = {}) {
  return apiRequest(`/api/orders/mine${queryString(options)}`);
}

export function getCustomerOrder(id) {
  return apiRequest(`/api/orders/${encodeURIComponent(id)}`);
}

export function cancelCustomerOrder(id) {
  return apiRequest(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: "PATCH" });
}

/* ------------------------------ Vendor orders ----------------------------- */

export function listVendorOrders(options = {}) {
  return apiRequest(`/api/vendor/orders${queryString(options)}`);
}

export function updateVendorOrderStatus(id, status) {
  return apiRequest(`/api/vendor/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
}

/* --------------------------- Vendor subscription -------------------------- */

export function getSubscription() {
  return apiRequest("/api/vendor/subscription");
}

export function createSubscriptionCheckout() {
  return apiRequest("/api/vendor/subscription/checkout", {
    method: "POST",
    body: {},
  });
}

export function cancelSubscription() {
  return apiRequest("/api/vendor/subscription/cancel", {
    method: "POST",
    body: {},
  });
}

/* ------------------------------ Vendor menu ------------------------------- */

export function listVendorMenu(options = {}) {
  return apiRequest(`/api/menu/mine${queryString(options)}`);
}

export function createVendorMenu(formData) {
  return apiUpload("/api/menu", formData);
}

export function updateVendorMenu(id, payload) {
  return apiRequest(`/api/menu/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function toggleVendorMenuAvailability(id) {
  return apiRequest(`/api/menu/${encodeURIComponent(id)}/availability`, {
    method: "PATCH",
  });
}

export function deleteVendorMenu(id) {
  return apiRequest(`/api/menu/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ------------------------------- Admin data ------------------------------- */

export function getAdminStats() {
  return apiRequest("/api/admin/dashboard/stats");
}

export function listAdminMenu(options = {}) {
  return apiRequest(`/api/admin/menu${queryString(options)}`);
}

export function moderateAdminMenu(id, status) {
  return apiRequest(`/api/admin/menu/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function setAdminMenuAvailability(id, isAvailable) {
  return apiRequest(`/api/admin/menu/${encodeURIComponent(id)}/availability`, {
    method: "PATCH",
    body: { isAvailable },
  });
}

export function deleteAdminMenu(id) {
  return apiRequest(`/api/admin/menu/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listAdminUsers(options = {}) {
  return apiRequest(`/api/admin/users${queryString(options)}`);
}

export function setAdminUserBlocked(id, blocked) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}/${blocked ? "block" : "unblock"}`, {
    method: "PATCH",
    body: {},
  });
}

export function listAdminTransactions(options = {}) {
  return apiRequest(`/api/admin/transactions${queryString(options)}`);
}
