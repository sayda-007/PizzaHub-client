export default function BrandIntroduction() {
  return (
    <section
      id="our-story"
      aria-labelledby="our-story-heading"
      className="border-b border-line bg-surface"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
        <div>
          <p className="eyebrow">Our story</p>
          <h2
            id="our-story-heading"
            className="section-heading mt-4 max-w-md"
          >
            A love for pizza, and the people around it.
          </h2>
        </div>

        <div>
          <p className="max-w-2xl font-heading text-xl leading-relaxed text-charcoal sm:text-2xl">
            Some meals are about more than what&apos;s on the plate. They&apos;re
            about who you share them with.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted">
            PizzaHub is a place to discover the pizzerias you&apos;ll come back
            to — and the slices that make an ordinary day feel a little more
            like an occasion.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <span aria-hidden="true" className="h-px w-12 bg-tomato" />
            <p className="text-sm text-ink-muted">Good pizza, shared well.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
