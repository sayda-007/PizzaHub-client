import Link from "next/link";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardLoading({ label = "Loading..." }) {
  return (
    <div
      role="status"
      className="flex min-h-52 items-center justify-center rounded-sm border border-line bg-surface text-sm text-ink-muted"
    >
      <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
      {label}
    </div>
  );
}

export function DashboardError({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-sm border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
    >
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">We couldn&apos;t load this section.</p>
          {message ? <p className="mt-1 leading-relaxed">{message}</p> : null}
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              className="mt-4 h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
            >
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DashboardEmpty({ title, description, href, actionLabel }) {
  return (
    <div className="rounded-sm border border-dashed border-line bg-surface px-6 py-12 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-8 text-ink-muted" />
      <h3 className="mt-4 font-heading text-xl text-charcoal">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {href && actionLabel ? (
        <Button
          asChild
          className="mt-5 h-10 bg-tomato px-4 text-paper hover:bg-tomato-deep hover:text-paper"
        >
          <Link href={href}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
