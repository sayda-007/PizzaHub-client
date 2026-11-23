import Link from "next/link";
import { notFound } from "next/navigation";

import MenuDetail from "@/components/menu/MenuDetail";
import { getPublicMenuItem } from "@/lib/public-menu";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = await getPublicMenuItem(id);

  // Resolve this before the page streams so notFound() can set a real 404.
  if (result.status === "missing") {
    notFound();
  }

  if (!result.item) {
    return { title: "Menu item | PizzaHub" };
  }

  return {
    title: `${result.item.itemName} | PizzaHub`,
    description:
      result.item.description || "View this item on the PizzaHub menu.",
  };
}

export default async function MenuItemPage({ params }) {
  const { id } = await params;
  const result = await getPublicMenuItem(id);

  if (result.status === "missing") {
    notFound();
  }

  if (result.status !== "ok" || !result.item) {
    return <MenuUnavailable message={result.message} />;
  }

  return <MenuDetail item={result.item} />;
}

function MenuUnavailable({ message }) {
  return (
    <main className="bg-paper">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-tomato uppercase">
          Menu temporarily unavailable
        </p>
        <h1 className="mt-3 font-heading text-4xl text-charcoal">
          We couldn&apos;t load this item
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
          {message || "Please try again shortly."}
        </p>
        <Link
          href="/menu"
          className="mt-7 inline-flex h-11 items-center rounded-sm bg-tomato px-5 text-sm font-medium text-paper transition-colors hover:bg-tomato-deep"
        >
          Back to menu
        </Link>
      </div>
    </main>
  );
}
