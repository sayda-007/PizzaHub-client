"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient, getDashboardHref, getSessionAccountRole } from "@/lib/auth-client";
import { authHref } from "@/lib/safe-return";

export default function RoleRedirect() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const role = getSessionAccountRole(session);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace(authHref("/sign-in", { returnTo: "/dashboard" }));
      return;
    }

    router.replace(getDashboardHref(role) ?? "/menu");
  }, [isPending, role, router, session?.user]);

  return (
    <main className="bg-paper">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
        {isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-tomato" />
            <p role="status" className="mt-4 text-sm text-ink-muted">
              Finding your dashboard...
            </p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-3xl text-charcoal">Taking you there</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              If you are not redirected automatically, choose a destination below.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline" className="border-line bg-paper text-charcoal">
                <Link href="/menu">Browse menu</Link>
              </Button>
              <Button asChild className="bg-tomato text-paper hover:bg-tomato-deep">
                <Link href={authHref("/sign-in", { returnTo: "/dashboard" })}>Sign in</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
