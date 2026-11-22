const benefits = [
  {
    title: "A menu worth exploring",
    description:
      "Browse pizzas by the things that matter to you, with clear names and descriptions that make choosing part of the pleasure.",
  },
  {
    title: "A simpler way to choose",
    description:
      "Thoughtful categories and concise details help you find the right slice without getting lost in the menu.",
  },
  {
    title: "Convenience at every step",
    description:
      "The path from browsing to ordering is designed to feel simple and clear, keeping the focus on the food.",
  },
];

export default function WhyChoose() {
  return (
    <section
      id="why-pizzahub"
      aria-labelledby="why-pizzahub-heading"
      className="border-b border-line bg-paper"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-28">
        <div>
          <p className="eyebrow">Why PizzaHub</p>
          <h2
            id="why-pizzahub-heading"
            className="section-heading mt-4 max-w-sm"
          >
            Good pizza deserves a better way in.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-muted">
            We make it easier to find the pizza you&apos;re in the mood for —
            and enjoy the choosing.
          </p>
          <div aria-hidden="true" className="mt-10 h-px w-20 bg-tomato" />
        </div>

        <ol className="divide-y divide-line border-y border-line">
          {benefits.map((benefit, index) => (
            <li
              key={benefit.title}
              className="grid gap-3 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6"
            >
              <span className="font-heading text-2xl leading-none text-tomato/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-heading text-xl font-medium text-charcoal sm:text-2xl">
                  {benefit.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
                  {benefit.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
