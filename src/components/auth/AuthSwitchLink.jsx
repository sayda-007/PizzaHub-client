"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authHref, safeReturnPath } from "@/lib/safe-return";

/** Keep `returnTo` when a visitor switches between sign-in and sign-up. */
export default function AuthSwitchLink({ href, children }) {
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("returnTo"), "");

  return (
    <Link
      href={authHref(href, { returnTo })}
      className="font-semibold text-tomato hover:text-tomato-deep"
    >
      {children}
    </Link>
  );
}
