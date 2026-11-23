"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Report only a safe marker; error details can contain sensitive data.
    console.error("[PizzaHub] A page error occurred.");
  }, [error]);

  return (
    <main className="bg-paper">
      <div className="mx-auto flex min-h-[65vh] w-full max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="font-heading text-4xl text-charcoal">Something went wrong.</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          We could not display this page. Try again, or head back to the menu.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            className="h-11 bg-tomato px-5 text-paper hover:bg-tomato-deep"
          >
            Try again
          </Button>
          <Button asChild variant="outline" className="h-11 border-line bg-paper px-5 text-charcoal">
            <Link href="/menu">Browse the menu</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
