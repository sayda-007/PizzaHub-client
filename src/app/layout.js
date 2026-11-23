import { Suspense } from "react";

import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "PizzaHub | Pizza Ordering & Delivery",
  description:
    "Discover local pizza favorites, explore restaurant menus and order from your neighborhood pizzerias.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-clip">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-sm focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-charcoal"
        >
          Skip to content
        </a>
        {/* Session and URL state are request-time data, so the shell streams in. */}
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="sticky top-0 z-50 h-18 border-b border-line bg-paper/95 backdrop-blur"
            />
          }
        >
          <Navbar />
        </Suspense>
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
