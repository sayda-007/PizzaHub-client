function SkeletonCard() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-sm border border-line bg-surface">
      <div className="aspect-[4/3] bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 bg-muted" />
        <div className="h-5 w-2/3 bg-muted" />
        <div className="h-3 w-full bg-muted" />
        <div className="h-3 w-4/5 bg-muted" />
        <div className="mt-5 h-px w-full bg-line" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="bg-paper">
      <section className="border-b border-line bg-paper">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="eyebrow">Browse menu</p>
          <h1 className="mt-4 max-w-2xl">Find something you&apos;ll love.</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Explore the pizzas and sides currently available from local
            PizzaHub kitchens.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
