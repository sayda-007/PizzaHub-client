import OrderDetail from "@/components/orders/OrderDetail";

export const metadata = {
  title: "Order details | PizzaHub",
  description: "Review the details and status of one PizzaHub order.",
};

// The order id is a runtime parameter and the details are fetched client-side.
export const instant = false;

export default async function OrderDetailPage({ params }) {
  const { id } = await params;

  return <OrderDetail id={id} />;
}
