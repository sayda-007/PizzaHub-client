import { Suspense } from "react";
import Link from "next/link";

import AuthLayout from "@/components/auth/AuthLayout";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Sign Up | PizzaHub",
  description: "Create a PizzaHub account as a customer or vendor.",
};

export default function SignUpPage({ searchParams }) {
  return (
    <AuthLayout
      eyebrow="Join PizzaHub"
      title="Your table is ready."
      description="Create an account to keep your details together, whether you are ordering a slice or running a kitchen."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-tomato hover:text-tomato-deep"
          >
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthFormFallback label="Loading sign-up form..." />}>
        <SignUpLoader searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function SignUpLoader({ searchParams }) {
  const query = await searchParams;
  const initialError =
    query?.auth_error === "google"
      ? "Google sign-up could not be completed. Please try again or use email and password."
      : "";

  return <SignUpForm initialError={initialError} />;
}

function AuthFormFallback({ label }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded-sm bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
