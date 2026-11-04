import type { ReactNode } from "react";

interface AuthSubmitButtonProps {
  isSubmitting: boolean;
  pendingLabel: string;
  children: ReactNode;
}

export default function AuthSubmitButton({
  isSubmitting,
  pendingLabel,
  children,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3 font-semibold text-black transition-all hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
    >
      {isSubmitting ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
