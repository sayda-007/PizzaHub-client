import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";

const explore = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Our Story", href: "/#our-story" },
  { label: "How It Works", href: "/#how-it-works" },
];

const ordering = [
  { label: "Browse menus", href: "/menu" },
  { label: "Track my orders", href: "/orders" },
  { label: "How ordering works", href: "/#how-it-works" },
];

const accounts = [
  { label: "Profile settings", href: "/profile" },
  { label: "Vendor area", href: "/vendor" },
  { label: "Admin area", href: "/admin" },
];

async function getCopyrightYear() {
  "use cache";

  return new Date().getFullYear();
}

export default async function Footer() {
  const year = await getCopyrightYear();

  return (
    <footer className="bg-charcoal text-paper">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          <div className="max-w-sm">
            <BrandLogo
              wordmarkClassName="text-2xl text-paper"
              emblemClassName="size-9"
            />
            <p className="mt-5 text-sm leading-relaxed text-paper/70">
              A home for neighborhood pizzerias, their menus, and the people who
              love a good slice.
            </p>
          </div>

          <nav aria-label="Footer explore">
            <h2 className="eyebrow text-orange">Explore</h2>
            <ul className="mt-5 space-y-3">
              {explore.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer ordering">
            <h2 className="eyebrow text-orange">Ordering</h2>
            <ul className="mt-5 space-y-3">
              {ordering.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer account">
            <h2 className="eyebrow text-orange">Account</h2>
            <ul className="mt-5 space-y-3">
              {accounts.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-paper/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-paper/55">
            &copy; {year} PizzaHub. All rights reserved.
          </p>
          <p className="font-heading text-sm italic text-paper/70">
            Made for the love of good pizza.
          </p>
        </div>
      </div>
    </footer>
  );
}
