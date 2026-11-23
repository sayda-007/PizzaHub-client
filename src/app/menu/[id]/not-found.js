import Link from "next/link";

export default function MenuItemNotFound() {
  return (
    <main className="bg-paper">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-tomato uppercase">
          Item not found
        </p>
        <h1 className="mt-3 font-heading text-4xl text-charcoal">
          This menu item isn&apos;t available
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
          It may have been removed, or it may no longer be available to order.
          Browse the current menu to find something else.
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
