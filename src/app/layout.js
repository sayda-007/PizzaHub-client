import "./globals.css";

export const metadata = {
  title: "PizzaHub | Pizza Ordering & Delivery",
  description:
    "Discover local pizza favorites, explore restaurant menus and order from your neighborhood pizzerias.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
