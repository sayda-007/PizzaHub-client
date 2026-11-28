import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../../", import.meta.url);
const readSource = (path) => readFile(new URL(path, ROOT), "utf8");

test("public catalog caches are tagged and invalidated after mutations", async () => {
  const tagModule = await readSource("src/lib/public-menu-cache.js");
  const publicMenu = await readSource("src/lib/public-menu.js");
  const action = await readSource("src/app/actions.js");

  assert.match(tagModule, /PUBLIC_MENU_CACHE_TAG\s*=\s*"public-menu"/);
  assert.match(publicMenu, /cacheTag\(PUBLIC_MENU_CACHE_TAG\)/);
  assert.match(action, /updateTag\(PUBLIC_MENU_CACHE_TAG\)/);

  for (const path of [
    "src/components/admin/AdminMenuManager.jsx",
    "src/components/vendor/VendorMenuForm.jsx",
    "src/components/vendor/VendorMenuPage.jsx",
  ]) {
    const source = await readSource(path);
    assert.match(source, /revalidatePublicMenu\(\)/, `${path} must invalidate the catalog`);
  }
});
