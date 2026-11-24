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
    <section className="w-full max-w-md rounded-xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">
        Prime Hairs
      </p>
      <h1 className="mt-3 text-3xl">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        No password needed. Continue with Google, or we&apos;ll email you a
        one-time code to sign in or create your account.
      </p>
      <SignInForm />
    </section>
  );
}
