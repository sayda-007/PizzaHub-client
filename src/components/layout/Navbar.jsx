"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/#menu" },
  { label: "Our Story", href: "/#our-story" },
  { label: "How It Works", href: "/#how-it-works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="PizzaHub home" className="shrink-0 rounded-sm">
          <BrandLogo />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navigation.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-ink-muted transition-colors hover:text-tomato"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <Button asChild className="px-4">
            <Link href="/#menu">Order Now</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-line text-charcoal md:hidden"
        >
          {open ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile"
        hidden={!open}
        className="border-t border-line bg-paper md:hidden"
      >
        <ul className="mx-auto flex w-full max-w-7xl flex-col px-5 py-2 sm:px-8">
          {navigation.map((item) => (
            <li key={item.label} className="border-b border-line">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-base font-medium text-charcoal hover:text-tomato"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="py-4">
            <Button asChild className="w-full">
              <Link href="/#menu" onClick={() => setOpen(false)}>
                Order Now
              </Link>
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
