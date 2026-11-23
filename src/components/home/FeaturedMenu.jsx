import Link from "next/link";

import MenuImage from "@/components/menu/MenuImage";

const layouts = [
  {
    article: "md:col-span-7",
    frame: "aspect-[4/5] sm:aspect-[16/10] md:aspect-[5/4]",
  },
  {
    article: "md:col-span-5",
    frame: "aspect-[4/5]",
  },
  {
    article:
      "md:col-span-12 md:grid md:grid-cols-[1fr_1.1fr] md:items-center md:gap-10",
    frame: "aspect-[4/3] md:aspect-[3/2]",
  },
];

const sizes = [
  "(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 54vw",
  "(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 38vw",
  "(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 45vw",
];

export default function FeaturedMenu({ items = [], status = "ok" }) {
  const previewItems = items.slice(0, 3);

  return (
    <section
      id="menu"
      aria-labelledby="menu-heading"
      className="border-b border-line bg-surface"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">From the menu</p>
            <h2 id="menu-heading" className="section-heading mt-4 max-w-lg">
              A few good places to begin.
            </h2>
          </div>
          <div className="flex max-w-sm flex-col items-start gap-4">
            <p className="text-sm leading-relaxed text-ink-muted">
              A small preview of the pizzas available right now — simple
              classics and bolder favorites.
            </p>
            <Link
              href="/menu"
              className="text-sm font-medium text-tomato hover:text-tomato-deep"
            >
              Browse the full menu <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {status === "error" ? (
          <p className="mt-14 rounded-sm border border-line bg-paper p-6 text-sm text-ink-muted">
            The menu is temporarily unavailable. Please check back shortly.
          </p>
        ) : previewItems.length === 0 ? (
          <p className="mt-14 rounded-sm border border-line bg-paper p-6 text-sm text-ink-muted">
            No menu items are available yet.
          </p>
        ) : (
          <div className="mt-14 grid gap-12 md:grid-cols-12 md:gap-x-8 md:gap-y-16">
            {previewItems.map((item, index) => {
              const layout = layouts[index % layouts.length];

              return (
                <article key={item.id} className={`relative ${layout.article}`}>
                  <Link
                    href={`/menu/${item.id}`}
                    aria-label={`View details for ${item.itemName}`}
                    className="absolute inset-0 z-10 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/30"
                  />
                  <figure>
                    <div
                      className={`relative overflow-hidden rounded-sm border border-line bg-muted ${layout.frame}`}
                    >
                      <MenuImage
                        src={item.images[0]}
                        alt={item.imageAlt}
                        sizes={sizes[index % sizes.length]}
                      />
                    </div>
                  </figure>
                  <div className={index === 2 ? "mt-6 md:mt-0" : "mt-5"}>
                    {item.category ? (
                      <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">
                        {item.category}
                      </p>
                    ) : null}
                    <h3 className="mt-2 font-heading text-2xl font-medium text-charcoal">
                      {item.itemName}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                      {item.description}
                    </p>
                    <div
                      aria-hidden="true"
                      className="mt-5 h-px w-12 bg-line"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
