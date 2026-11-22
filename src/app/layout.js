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
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
