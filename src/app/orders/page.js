import OrdersDashboard from "@/components/orders/OrdersDashboard";

export const metadata = {
  title: "My orders | PizzaHub",
  description: "Track and manage your PizzaHub orders.",
};

export default function OrdersPage() {
  return <OrdersDashboard />;
}
