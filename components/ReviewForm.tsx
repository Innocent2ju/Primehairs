"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";

import type { ReviewActionResult } from "@/lib/reviews";
import { cn } from "@/lib/utils";

interface Props {
  /** Server action bound to this product's slug. */
  action: (
    state: ReviewActionResult,
    formData: FormData,
  ) => Promise<ReviewActionResult>;
  /** Identity taken from the Neon Auth session on the server, never typed in by the client. */
  reviewer: { name: string; email: string } | null;
}

const STARS = [1, 2, 3, 4, 5];

const ReviewForm = ({ action, reviewer }: Props) => {
  const [rating, setRating] = useState(0);
  const [state, formAction, isPending] = useActionState<
    ReviewActionResult,
    FormData
  >(action, { status: "idle" });

  if (!reviewer) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-gold/30 bg-[#1A1A1A]/60 p-6">
        <p className="text-sm text-light-gray/80">
          Sign in to leave a review for this product.
        </p>
        <Link
          href="/sign-in"
          className="rounded-full border border-gold/40 px-6 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
        >
          Sign in to review
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-gold/20 bg-[#1A1A1A]/80 p-6"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-widest text-gold">
          Reviewing as
        </span>
        <span className="text-sm text-light-gray">
          {reviewer.name}{" "}
          <span className="text-light-gray/60">({reviewer.email})</span>
        </span>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs uppercase tracking-widest text-gold">
          Your rating
        </legend>
        <div className="flex items-center gap-1">
          {STARS.map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                required
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-6 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60",
                  value <= rating
                    ? "fill-gold text-gold"
                    : "text-light-gray/40 hover:text-gold/70",
                )}
              />
              <span className="sr-only">
                {value} {value === 1 ? "star" : "stars"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="review-comment"
          className="text-xs uppercase tracking-widest text-gold"
        >
          Your review
        </label>
        <textarea
          id="review-comment"
          name="comment"
          required
          maxLength={2000}
          rows={4}
          placeholder="Tell others what you think about this product."
          className="rounded-md border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none focus:border-gold"
        />
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-300">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p role="status" className="text-sm text-emerald-300">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit cursor-pointer rounded-md bg-gold px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Posting..." : "Post review"}
      </button>
    </form>
  );
};

export default ReviewForm;
