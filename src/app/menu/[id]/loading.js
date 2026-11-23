export default function Loading() {
  return (
    <main className="bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="h-4 w-24 animate-pulse rounded-sm bg-muted" role="status" aria-label="Loading menu item" />

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
          <div>
            <div className="aspect-[4/3] animate-pulse rounded-sm border border-line bg-muted" />
            <div className="mt-8 space-y-4 rounded-sm border border-line bg-surface p-6 sm:p-7">
              <div className="h-3 w-28 animate-pulse rounded-sm bg-muted" />
              <div className="h-10 w-2/3 animate-pulse rounded-sm bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded-sm bg-muted" />
            </div>
          </div>

          <div className="space-y-5 rounded-sm border border-line bg-surface p-6 sm:p-7">
            <div className="h-7 w-44 animate-pulse rounded-sm bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-sm bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-sm bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
            <p className="text-sm text-ink-muted">Loading menu item...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
