import RoleRedirect from "@/components/dashboard/RoleRedirect";

export const metadata = {
  title: "Your dashboard | PizzaHub",
  description: "Go to the dashboard for your PizzaHub account type.",
};

export default function DashboardPage() {
  return <RoleRedirect />;
}
