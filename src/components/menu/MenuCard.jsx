import MenuImage from "@/components/menu/MenuImage";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function MenuCard({ item }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border border-line bg-surface">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <MenuImage
          src={item.images[0]}
          alt={item.imageAlt}
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {item.category ? (
          <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">
            {item.category}
          </p>
        ) : null}

        <h3 className="mt-2 font-heading text-xl font-medium text-charcoal">
          {item.itemName}
        </h3>

        {item.description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {item.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-4 text-sm">
          <span className="font-medium text-charcoal">
            {priceFormatter.format(item.price)}
          </span>
          {item.location ? (
            <span className="text-ink-muted">{item.location}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
