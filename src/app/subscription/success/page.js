import { Suspense } from "react";

import SubscriptionReturn from "@/components/payment/SubscriptionReturn";

export const metadata = {
  title: "Checkout complete | PizzaHub",
  description: "Confirm your PizzaHub Premium subscription after Stripe checkout.",
};

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-paper">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
            <div className="h-72 animate-pulse rounded-sm border border-line bg-muted" />
          </div>
        </main>
      }
    >
      <SubscriptionReturn variant="success" />
    </Suspense>
  );
}
