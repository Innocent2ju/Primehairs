/** Must match `emailAndPassword` limits in `lib/auth.ts` (better-auth defaults max to 128). */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_NAME_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInField = "email" | "password";
export type SignUpField = "name" | "email" | "password" | "confirmPassword";

export type FormValues<TField extends string> = Record<TField, string>;
export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
}

export function validateSignIn(values: FormValues<SignInField>): FieldErrors<SignInField> {
  const errors: FieldErrors<SignInField> = {};

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (!values.password) errors.password = "Enter your password.";

  return errors;
}

export function validateSignUp(values: FormValues<SignUpField>): FieldErrors<SignUpField> {
  const errors: FieldErrors<SignUpField> = {};
  const name = values.name.trim();

  if (!name) errors.name = "Enter your name.";
  else if (name.length > MAX_NAME_LENGTH)
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  else if (values.password.length > MAX_PASSWORD_LENGTH)
    errors.password = `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;

  if (!values.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = "Passwords do not match.";

  return errors;
}

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some(Boolean);
}

export const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Try signing in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Try signing in instead.",
};

const TOO_MANY_REQUESTS_STATUS = 429;

export interface AuthClientError {
  code?: string;
  message?: string;
  status?: number;
}

/** Turns a better-auth client error into a message suitable for the form. */
export function getAuthErrorMessage(error: AuthClientError): string {
  if (error.status === TOO_MANY_REQUESTS_STATUS)
    return "Too many attempts. Please wait a moment and try again.";

  return (error.code && AUTH_ERROR_MESSAGES[error.code]) || error.message || GENERIC_AUTH_ERROR;
}
