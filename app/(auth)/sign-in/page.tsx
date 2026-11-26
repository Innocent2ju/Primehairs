import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign In",
  description:
    "Sign in to PrimeHairs with Google or a one-time code sent to your email.",
  path: "/sign-in",
});

export default function SignInPage() {
  return (
    <section className="w-full max-w-md rounded-xl p-8 shadow-2xl backdrop-blur-xl sm:p-10">
      <h1 className="mt-3 text-3xl">Welcome to Prime Hairs </h1>
      <SignInForm />
    </section>
  );
}
