export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}) {
  return (
    <main className="bg-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-start lg:gap-16 lg:py-24">
        <section className="lg:pt-10">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-xl">{title}</h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            {description}
          </p>
          <div className="mt-8 hidden max-w-md border-l-2 border-tomato/30 pl-5 lg:block">
            <p className="font-heading text-base italic text-charcoal">
              Good food brings people together.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              One account keeps your PizzaHub details in one place.
            </p>
          </div>
        </section>

        <section className="rounded-sm border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(41,37,31,0.06)] sm:p-8">
          {children}
          {footer ? (
            <div className="mt-7 border-t border-line pt-6 text-sm leading-relaxed text-ink-muted">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
