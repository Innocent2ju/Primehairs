"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateSignUp,
  type SignUpField,
} from "@/lib/auth-validation";
import { ROUTES, withRedirect } from "@/lib/routes";
import AuthFormError from "./AuthFormError";
import AuthFormField from "./AuthFormField";
import AuthSubmitButton from "./AuthSubmitButton";
import { useAuthForm } from "./useAuthForm";

export default function SignUpForm() {
  const { handleSubmit, handleChange, fieldErrors, formError, isSubmitting, redirectTo } =
    useAuthForm<SignUpField>({
      validate: validateSignUp,
      submit: ({ name, email, password }) =>
        authClient.signUp.email({ name: name.trim(), email: email.trim(), password }),
    });

  return (
    <form onSubmit={handleSubmit} onChange={handleChange} noValidate className="flex flex-col gap-4">
      <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
        <AuthFormField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={fieldErrors.password}
        />
        <AuthFormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
      </fieldset>

      <AuthFormError message={formError} />

      <AuthSubmitButton isSubmitting={isSubmitting} pendingLabel="Creating account...">
        Create account
      </AuthSubmitButton>

      <p className="text-center text-sm text-light-gray/70">
        Already have an account?{" "}
        <Link href={withRedirect(ROUTES.signIn, redirectTo)} className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
