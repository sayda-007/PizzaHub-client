import { Suspense } from "react";
import Link from "next/link";
import {
  CakeSlice,
  ChevronDown,
  Flame,
  Leaf,
  MapPin,
  Pizza,
  Search,
  SlidersHorizontal,
  Soup,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";

import MenuCard from "@/components/menu/MenuCard";
import {
  DEFAULT_MENU_QUERY,
  MENU_CATEGORIES,
  MENU_SORT_OPTIONS,
  activeMenuFilters,
  canonicalizeMenuLocation,
  filterMenuHref,
  hasActiveMenuFilters,
  menuHref,
  normalizeMenuQuery,
} from "@/lib/menu-query";
import { getMenuLocations, getPublicMenu } from "@/lib/public-menu";

export const metadata = {
  title: "Browse Menu | PizzaHub",
  description:
    "Explore pizzas and sides currently available from PizzaHub kitchens.",
};

const labelClass =
  "block text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase";
const controlClass =
  "mt-2 h-11 w-full appearance-none rounded-sm border border-line bg-paper px-3 text-sm text-charcoal placeholder:text-ink-muted";

const CATEGORY_ICONS = Object.freeze({
  "Classic Pizzas": Pizza,
  "Vegetarian Pizzas": Leaf,
  "Meat Lovers": Flame,
  "Specialty / Gourmet Pizzas": Sparkles,
  "Sides & Appetizers": Soup,
  "Beverages & Desserts": CakeSlice,
});

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
  const rawQuery = normalizeMenuQuery(await searchParams);
  const locations = await getMenuLocations();
  const query = {
    ...rawQuery,
    location: canonicalizeMenuLocation(rawQuery.location, locations),
  };
  const menu = await getPublicMenu(query);
  const { limit, totalItems, totalPages } = menu.pagination;
  const currentPage = Math.min(
    Math.max(menu.pagination.page, 1),
    Math.max(totalPages, 1),
  );
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);
  const hasFilters = hasActiveMenuFilters(query);

  return (
    <>
      <MenuFilters query={query} locations={locations} />
      <ActiveFilters query={query} />

      {menu.status === "error" ? (
        <MenuNotice title="The menu is unavailable" tone="error">
          {menu.message}
        </MenuNotice>
      ) : totalItems === 0 ? (
        hasFilters ? (
          <MenuNotice title="No matches for these filters">
            Try a different search, category, or location. Removing a filter
            often brings more items back.
            <div className="mt-5">
              <Link
                href="/menu"
                className="inline-flex rounded-sm bg-tomato px-4 py-2 text-sm font-semibold text-paper hover:bg-tomato-deep hover:text-paper"
              >
                Clear all filters
              </Link>
            </div>
          </MenuNotice>
        ) : (
          <MenuNotice title="The menu is being prepared">
            There are no approved menu items available right now. Please check
            back soon.
          </MenuNotice>
        )
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-ink-muted">
            <p aria-live="polite">
              <span className="font-semibold text-charcoal">{totalItems}</span>{" "}
              {hasFilters ? "matching menu items" : "menu items available"}.
            </p>
            <p>
              Showing {startItem}&ndash;{endItem}
              {totalPages > 1 ? ` (page ${currentPage} of ${totalPages})` : null}.
            </p>
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

function MenuFilters({ query, locations }) {
  const formKey = [
    query.search,
    query.category,
    query.location,
    query.sort,
    query.limit,
    locations.join("|"),
  ].join("::");

  return (
    <form
      key={formKey}
      action="/menu"
      method="get"
      aria-label="Filter menu"
      className="mt-10 rounded-sm border border-line bg-surface p-5 shadow-[0_18px_45px_-38px_rgba(41,37,31,0.45)] sm:p-6"
    >
      <div>
        <label htmlFor="menu-search" className={labelClass}>
          Search the menu
        </label>
        <div className="relative mt-2">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="menu-search"
            name="search"
            type="search"
            defaultValue={query.search}
            maxLength={100}
            placeholder="Search for your favourite pizza..."
            className="h-14 w-full rounded-sm border border-line bg-paper pr-28 pl-12 text-base text-charcoal placeholder:text-ink-muted"
          />
          {query.search ? (
            <Link
              href={filterMenuHref(query, { search: "" })}
              className="absolute top-1/2 right-3 inline-flex -translate-y-1/2 items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold text-ink-muted hover:text-tomato"
            >
              <X aria-hidden="true" className="size-3.5" />
              Clear
            </Link>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">
          Find menu items by name.
        </p>
      </div>

      <div className="mt-8">
        <p id="menu-categories-label" className={labelClass}>
          Categories
        </p>
        <div
          role="group"
          aria-labelledby="menu-categories-label"
          className="mt-3 flex flex-wrap gap-2"
        >
          <FilterChip
            href={filterMenuHref(query, { category: "" })}
            selected={!query.category}
            icon={UtensilsCrossed}
          >
            All items
          </FilterChip>
          {MENU_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category] ?? UtensilsCrossed;

            return (
              <FilterChip
                key={category}
                href={filterMenuHref(query, { category })}
                selected={query.category === category}
                icon={Icon}
              >
                {category}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
        <div>
          <label htmlFor="menu-location" className={labelClass}>
            Location
          </label>
          <div className="relative">
            <MapPin
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            />
            <select
              id="menu-location"
              name="location"
              defaultValue={query.location}
              disabled={locations.length === 0 && !query.location}
              className={`${controlClass} pr-9 pl-9 disabled:text-ink-muted`}
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
              {query.location &&
              !locations.some(
                (location) => location.toLowerCase() === query.location.toLowerCase(),
              ) ? (
                <option value={query.location}>{query.location}</option>
              ) : null}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            Choose the kitchen area recorded on menu items.
          </p>
        </div>

        <div>
          <label htmlFor="menu-sort" className={labelClass}>
            Sort by
          </label>
          <div className="relative">
            <SlidersHorizontal
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            />
            <select
              id="menu-sort"
              name="sort"
              defaultValue={query.sort}
              className={`${controlClass} pr-9 pl-9`}
            >
              {MENU_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            Choose how your menu is ordered.
          </p>
        </div>
      </div>

      {query.category ? (
        <input type="hidden" name="category" value={query.category} />
      ) : null}
      {query.limit !== DEFAULT_MENU_QUERY.limit ? (
        <input type="hidden" name="limit" value={query.limit} />
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-xs text-ink-muted">
          Changing a filter starts again at page 1.
        </p>
        <button
          type="submit"
          className="rounded-sm bg-tomato px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tomato-deep hover:text-paper"
        >
          Update menu
        </button>
      </div>
    </form>
  );
}

function FilterChip({ href, selected, icon: Icon, children }) {
  const state = selected
    ? "border-tomato bg-tomato text-paper hover:border-tomato-deep hover:bg-tomato-deep hover:text-paper"
    : "border-line bg-paper text-charcoal hover:border-tomato hover:text-tomato";

  return (
    <Link
      href={href}
      aria-current={selected ? "true" : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${state}`}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span>{children}</span>
    </Link>
  );
}

function ActiveFilters({ query }) {
  const filters = activeMenuFilters(query);

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className={labelClass}>Active</span>
      {filters.map((filter) => (
        <Link
          key={filter.key}
          href={filter.href}
          aria-label={`Remove ${filter.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-charcoal hover:border-tomato hover:text-tomato"
        >
          <span aria-hidden="true" className="max-w-52 truncate">
            {filter.label}
          </span>
          <X aria-hidden="true" className="size-3.5" />
        </Link>
      ))}
      <Link
        href="/menu"
        className="px-1 text-xs font-semibold text-tomato underline underline-offset-4 hover:text-tomato-deep"
      >
        Clear all
      </Link>
    </div>
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
    ? "border-tomato bg-tomato text-paper hover:bg-tomato-deep hover:text-paper"
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

function MenuNotice({ title, children, tone = "info" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="mt-12 rounded-sm border border-line bg-surface p-8"
    >
      <h2 className="font-heading text-xl font-medium text-charcoal">{title}</h2>
      <div className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
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
    <div role="status" className="mt-10">
      <span className="sr-only">Loading menu...</span>
      <div aria-hidden="true">
        <div className="rounded-sm border border-line bg-surface p-5 sm:p-6">
          <div className="h-14 rounded-sm bg-muted" />
          <div className="mt-8 flex flex-wrap gap-2">
            {MENU_CATEGORIES.map((category) => (
              <div key={category} className="h-9 w-28 rounded-full bg-muted" />
            ))}
          </div>
          <div className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
            <div className="h-11 rounded-sm bg-muted" />
            <div className="h-11 rounded-sm bg-muted" />
          </div>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
