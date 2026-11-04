import { Suspense } from "react";
import type { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Create account | Prime Hairs" };

export default function SignUpPage() {
  return (
    <>
      <h3 className="mb-6 text-center">Create account</h3>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </>
  );
}
