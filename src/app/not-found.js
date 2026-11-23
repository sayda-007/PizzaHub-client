import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-paper">
      <div className="mx-auto flex min-h-[65vh] w-full max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="eyebrow text-tomato">404 · Page not found</p>
        <h1 className="mt-4 font-heading text-4xl text-charcoal sm:text-5xl">
          This slice is missing.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          The page you asked for does not exist or has moved. The menu is a good place to start again.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild className="h-11 bg-tomato px-5 text-paper hover:bg-tomato-deep">
            <Link href="/menu">Browse the menu</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 border-line bg-paper px-5 text-charcoal">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
