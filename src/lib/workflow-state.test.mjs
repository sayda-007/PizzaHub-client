import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../../", import.meta.url);
const readSource = (path) => readFile(new URL(path, ROOT), "utf8");

test("workflow UI state follows authoritative backend values", async () => {
  const users = await readSource("src/components/admin/AdminUsersManager.jsx");
  const transactions = await readSource(
    "src/components/admin/AdminTransactionsManager.jsx",
  );
  const orderDetail = await readSource("src/components/orders/OrderDetail.jsx");
  const vendorMenu = await readSource("src/components/vendor/VendorMenuPage.jsx");

  assert.match(users, /disabled=\{isAdmin \|\| isSelf \|\| allDisabled\}/);
  assert.match(transactions, /paymentStatus \?\? transaction\.status/);
  assert.match(orderDetail, /formatDate\(order\.deliveryDate\)/);
  assert.match(vendorMenu, /setPage\(page - 1\)/);
});
