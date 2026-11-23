import { Suspense } from "react";
import Link from "next/link";

import MenuCard from "@/components/menu/MenuCard";
import {
  DEFAULT_MENU_QUERY,
  MENU_CATEGORIES,
  MENU_SORT_OPTIONS,
  hasActiveMenuFilters,
  menuHref,
  normalizeMenuQuery,
} from "@/lib/menu-query";
import { getPublicMenu } from "@/lib/public-menu";

export const metadata = {
  title: "Browse Menu | PizzaHub",
  description:
    "Explore pizzas and sides currently available from PizzaHub kitchens.",
};

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-charcoal placeholder:text-ink-muted";

export default function MenuPage({ searchParams }) {
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

          <Suspense fallback={<MenuBrowserFallback />}>
            <MenuBrowser searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function MenuBrowser({ searchParams }) {
  const query = normalizeMenuQuery(await searchParams);
  const menu = await getPublicMenu(query);
  const { limit, totalItems, totalPages } = menu.pagination;
  const currentPage = Math.min(
    Math.max(menu.pagination.page, 1),
    Math.max(totalPages, 1),
  );
  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);
  const hasFilters = hasActiveMenuFilters(query);

  return (
    <>
      <MenuFilters query={query} />

      {menu.status === "error" ? (
        <MenuNotice title="The menu is unavailable">{menu.message}</MenuNotice>
      ) : menu.items.length === 0 ? (
        <MenuNotice title="No matching menu items">
          Try a different search, category, or location. Category and location
          filters must match the menu item exactly.
        </MenuNotice>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
            <p>
              Showing {startItem}&ndash;{endItem} of {totalItems} menu items
              {totalPages > 1 ? ` (page ${currentPage} of ${totalPages})` : null}.
            </p>
            {hasFilters ? (
              <Link
                href="/menu"
                className="font-medium text-charcoal underline underline-offset-4 hover:text-tomato"
              >
                Clear all filters
              </Link>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {menu.items.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>

          <Pagination query={query} pagination={menu.pagination} />
        </>
      )}
    </>
  );
}

function MenuFilters({ query }) {
  const preserveLimit = query.limit !== DEFAULT_MENU_QUERY.limit;

  return (
    <form
      key={`${query.search}|${query.category}|${query.location}|${query.sort}|${query.page}|${query.limit}`}
      action="/menu"
      method="get"
      aria-label="Filter menu"
      className="mt-10 rounded-sm border border-line bg-surface p-5 sm:p-6"
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="menu-search" className={labelClass}>
            Search
          </label>
          <input
            id="menu-search"
            name="search"
            type="search"
            defaultValue={query.search}
            maxLength={100}
            placeholder="Pizza, dessert, sides..."
            aria-describedby="menu-search-help"
            className={controlClass}
          />
          <p id="menu-search-help" className="mt-1.5 text-xs text-ink-muted">
            Searches item names and descriptions.
          </p>
        </div>

        <div>
          <label htmlFor="menu-category" className={labelClass}>
            Category
          </label>
          <input
            id="menu-category"
            name="category"
            type="text"
            list="menu-category-options"
            defaultValue={query.category}
            maxLength={120}
            placeholder="Exact category name"
            aria-describedby="menu-category-help"
            className={controlClass}
          />
          <datalist id="menu-category-options">
            {MENU_CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <p id="menu-category-help" className="mt-1.5 text-xs text-ink-muted">
            Suggestions are PizzaHub categories; matching is exact.
          </p>
        </div>

        <div>
          <label htmlFor="menu-location" className={labelClass}>
            Location
          </label>
          <input
            id="menu-location"
            name="location"
            type="text"
            defaultValue={query.location}
            maxLength={120}
            placeholder="Kitchen or area"
            aria-describedby="menu-location-help"
            className={controlClass}
          />
          <p id="menu-location-help" className="mt-1.5 text-xs text-ink-muted">
            Matches the location recorded on the menu item.
          </p>
        </div>

        <div>
          <label htmlFor="menu-sort" className={labelClass}>
            Sort by
          </label>
          <select
            id="menu-sort"
            name="sort"
            defaultValue={query.sort}
            aria-describedby="menu-sort-help"
            className={controlClass}
          >
            {MENU_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {preserveLimit ? (
            <input type="hidden" name="limit" value={query.limit} />
          ) : null}
          <p id="menu-sort-help" className="mt-1.5 text-xs text-ink-muted">
            Changing a filter returns to page 1.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="rounded-sm bg-tomato px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tomato-deep"
        >
          Apply filters
        </button>
        <Link
          href="/menu"
          className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-charcoal"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

function Pagination({ query, pagination }) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const currentPage = Math.min(
    Math.max(pagination.page, 1),
    pagination.totalPages,
  );
  const items = paginationItems(currentPage, pagination.totalPages);

  return (
    <nav
      aria-label="Menu pagination"
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <PaginationLink href={menuHref(query, { page: currentPage - 1 })}>
          Previous
        </PaginationLink>
      ) : (
        <PaginationPlaceholder>Previous</PaginationPlaceholder>
      )}

      <ul className="flex flex-wrap items-center justify-center gap-2">
        {items.map((item) =>
          item.gap ? (
            <li key={item.key} aria-hidden="true" className="px-1 text-ink-muted">
              &hellip;
            </li>
          ) : (
            <li key={item.key}>
              <PaginationLink
                href={menuHref(query, { page: item.value })}
                current={item.value === currentPage}
              >
                {item.value}
              </PaginationLink>
            </li>
          ),
        )}
      </ul>

      {currentPage < pagination.totalPages ? (
        <PaginationLink href={menuHref(query, { page: currentPage + 1 })}>
          Next
        </PaginationLink>
      ) : (
        <PaginationPlaceholder>Next</PaginationPlaceholder>
      )}
    </nav>
  );
}

function paginationItems(current, total) {
  const visible = new Set([
    1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = [...visible]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const items = [];
  let previous = 0;

  for (const page of sorted) {
    if (previous && page - previous > 1) {
      items.push({ key: `gap-${page}`, gap: true });
    }

    items.push({ key: `page-${page}`, value: page });
    previous = page;
  }

  return items;
}

function PaginationLink({ href, current = false, children }) {
  const state = current
    ? "border-tomato bg-tomato text-paper"
    : "border-line bg-surface text-charcoal hover:border-tomato hover:text-tomato";

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex min-w-9 items-center justify-center rounded-sm border px-3 py-2 text-sm font-medium transition-colors ${state}`}
    >
      {children}
    </Link>
  );
}

function PaginationPlaceholder({ children }) {
  return (
    <span
      aria-disabled="true"
      className="inline-flex min-w-9 items-center justify-center rounded-sm border border-line bg-paper px-3 py-2 text-sm font-medium text-ink-muted"
    >
      {children}
    </span>
  );
}

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

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-sm border border-line bg-surface"
    >
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

function MenuBrowserFallback() {
  return (
    <div aria-hidden="true">
      <div className="mt-10 rounded-sm border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-20 bg-muted" />
              <div className="h-10 w-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}
