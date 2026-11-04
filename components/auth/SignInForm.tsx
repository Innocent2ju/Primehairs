"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { validateSignIn, type SignInField } from "@/lib/auth-validation";
import { ROUTES, withRedirect } from "@/lib/routes";
import AuthFormError from "./AuthFormError";
import AuthFormField from "./AuthFormField";
import AuthSubmitButton from "./AuthSubmitButton";
import { useAuthForm } from "./useAuthForm";

export default function SignInForm() {
  const { handleSubmit, handleChange, fieldErrors, formError, isSubmitting, redirectTo } =
    useAuthForm<SignInField>({
      validate: validateSignIn,
      submit: ({ email, password }) =>
        authClient.signIn.email({ email: email.trim(), password }),
    });

  return (
    <form onSubmit={handleSubmit} onChange={handleChange} noValidate className="flex flex-col gap-4">
      <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
        <AuthFormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <AuthFormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={fieldErrors.password}
        />
      </fieldset>

      <AuthFormError message={formError} />

      <AuthSubmitButton isSubmitting={isSubmitting} pendingLabel="Signing in...">
        Sign in
      </AuthSubmitButton>

      <p className="text-center text-sm text-light-gray/70">
        New to Prime Hairs?{" "}
        <Link href={withRedirect(ROUTES.signUp, redirectTo)} className="text-gold hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
