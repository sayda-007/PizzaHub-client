const steps = [
  {
    number: "01",
    title: "Explore",
    description: "Browse the available pizza menu and see what catches your eye.",
  },
  {
    number: "02",
    title: "Choose",
    description: "Compare the options, pick your favorite, and make it yours.",
  },
  {
    number: "03",
    title: "Order",
    description: "The final step will be placing your order through PizzaHub.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="border-b border-paper/10 bg-charcoal text-paper"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-orange">How it works</p>
            <h2
              id="how-it-works-heading"
              className="section-heading mt-4 max-w-md text-paper"
            >
              From first look to first bite.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-paper/60">
            A simple path, designed around the moment you decide what&apos;s for
            dinner.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          <span
            aria-hidden="true"
            className="absolute top-[17px] right-0 left-0 hidden h-px bg-paper/20 sm:block"
          />
          {steps.map((step, index) => (
            <li key={step.number} className="relative pl-14 sm:pl-0 sm:pt-12">
              <span className="absolute top-0 left-0 flex size-9 items-center justify-center border border-paper/25 bg-charcoal font-heading text-sm text-orange sm:top-0">
                {step.number}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-9 -bottom-10 left-[17px] w-px bg-paper/15 sm:hidden"
                />
              )}
              <h3 className="font-heading text-2xl font-medium text-paper">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/65">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
