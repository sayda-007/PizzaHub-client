import MenuCard from "@/components/menu/MenuCard";
import { getPublicMenu } from "@/lib/public-menu";

export const metadata = {
  title: "Browse Menu | PizzaHub",
  description:
    "Explore pizzas and sides currently available from PizzaHub kitchens.",
};

function MenuNotice({ title, children }) {
  return (
    <div className="mt-12 rounded-sm border border-line bg-surface p-8">
      <h2 className="font-heading text-xl font-medium text-charcoal">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        {children}
      </p>
    </div>
  );
}

export default async function MenuPage() {
  const menu = await getPublicMenu();

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

          {menu.status === "error" ? (
            <MenuNotice title="The menu is unavailable">
              {menu.message}
            </MenuNotice>
          ) : menu.items.length === 0 ? (
            <MenuNotice title="No menu items yet">
              There are no menu items available right now. Please check back
              soon.
            </MenuNotice>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {menu.items.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
