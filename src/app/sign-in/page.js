import { Suspense } from "react";
import Link from "next/link";

import AuthLayout from "@/components/auth/AuthLayout";
import SignInForm from "@/components/auth/SignInForm";

export const metadata = {
  title: "Sign In | PizzaHub",
  description: "Sign in to your PizzaHub account.",
};

export default function SignInPage({ searchParams }) {
  return (
    <AuthLayout
      eyebrow="Your account"
      title="Good to see you again."
      description="Sign in with your email and password, or continue with Google if it is available on this deployment."
      footer={
        <>
          New to PizzaHub?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-tomato hover:text-tomato-deep"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthFormFallback label="Loading sign-in form..." />}>
        <SignInLoader searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function SignInLoader({ searchParams }) {
  const query = await searchParams;
  const initialError =
    query?.auth_error === "google"
      ? "Google sign-in could not be completed. Please try again or use email and password."
      : "";

  return <SignInForm initialError={initialError} />;
}

function AuthFormFallback({ label }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded-sm bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-sm bg-muted" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
