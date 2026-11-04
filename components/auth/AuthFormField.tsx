import type { InputHTMLAttributes } from "react";

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

export default function AuthFormField({ label, name, error, hint, ...inputProps }: AuthFormFieldProps) {
  const messageId = `${name}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={name} className="text-light-gray">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required
        aria-invalid={!!error}
        aria-describedby={message ? messageId : undefined}
        className={`rounded-lg border bg-black/40 px-3 py-2.5 text-white focus:outline-none focus:ring-1 disabled:opacity-60 ${
          error ? "border-red-400/60 focus:ring-red-400/60" : "border-white/10 focus:ring-gold/60"
        }`}
        {...inputProps}
      />
      {message && (
        <p id={messageId} className={error ? "text-red-400" : "text-light-gray/60"}>
          {message}
        </p>
      )}
    </div>
  );
}
