import { Suspense } from "react";
import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Sign in | Prime Hairs" };

export default function SignInPage() {
  return (
    <>
      <h3 className="mb-6 text-center">Sign in</h3>
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
