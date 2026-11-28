"use server";

import { updateTag } from "next/cache";

import { PUBLIC_MENU_CACHE_TAG } from "@/lib/public-menu-cache";

/**
 * Expire the cached public catalog after a vendor or admin mutation. Dashboard
 * components call this from the browser after their backend write succeeds;
 * the next public page read then fetches fresh data immediately.
 */
export async function revalidatePublicMenu() {
  updateTag(PUBLIC_MENU_CACHE_TAG);
}
