"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GENERIC_AUTH_ERROR,
  getAuthErrorMessage,
  hasErrors,
  type AuthClientError,
  type FieldErrors,
  type FormValues,
} from "@/lib/auth-validation";
import { getSafeRedirectPath, REDIRECT_PARAM } from "@/lib/routes";

type AuthResult = { error: AuthClientError | null };

interface UseAuthFormOptions<TField extends string> {
  validate: (values: FormValues<TField>) => FieldErrors<TField>;
  submit: (values: FormValues<TField>) => Promise<AuthResult>;
}

function readFormValues<TField extends string>(form: HTMLFormElement): FormValues<TField> {
  const entries = Array.from(new FormData(form), ([key, value]) => [key, String(value)]);
  return Object.fromEntries(entries) as FormValues<TField>;
}

/** Shared validation, submit, loading, error and redirect handling for the auth forms. */
export function useAuthForm<TField extends string>({ validate, submit }: UseAuthFormOptions<TField>) {
  const router = useRouter();
  const redirectTo = getSafeRedirectPath(useSearchParams().get(REDIRECT_PARAM));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<TField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const values = readFormValues<TField>(event.currentTarget);
    const errors = validate(values);
    setFieldErrors(errors);
    setFormError(null);
    if (hasErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const { error } = await submit(values);
      if (error) {
        setFormError(getAuthErrorMessage(error));
        setIsSubmitting(false);
        return;
      }
      // Stay in the loading state while navigating away.
      router.push(redirectTo);
      router.refresh();
    } catch {
      setFormError(GENERIC_AUTH_ERROR);
      setIsSubmitting(false);
    }
  }

  /** Clears a field's error as soon as the user edits it. */
  function handleChange(event: FormEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement;
    if (!(name in fieldErrors)) return;

    setFieldErrors((current) => {
      const next = { ...current };
      delete next[name as TField];
      return next;
    });
  }

  return { handleSubmit, handleChange, fieldErrors, formError, isSubmitting, redirectTo };
}
