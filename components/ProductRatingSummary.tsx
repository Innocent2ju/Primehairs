import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  count: number;
  highestStars: number | null;
  className?: string;
}

/**
 * Real review data only: the star score is shown solely when the product has
 * reviews, otherwise just the review link with a zero count.
 */
export const ProductRatingSummary = ({
  slug,
  count,
  highestStars,
  className,
}: Props) => {
  const hasRating = count > 0 && highestStars !== null && highestStars > 0;

  return (
    <Link
      href={`/products/${slug}/reviews`}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 text-xs text-light-gray/80 transition-colors hover:text-gold",
        className,
      )}
      aria-label={
        hasRating
          ? `Rated ${highestStars} out of 5 by ${count} ${count === 1 ? "person" : "people"}`
          : `${count} people reviewed`
      }
    >
      {hasRating ? (
        <span className="inline-flex items-center gap-1 font-semibold text-gold">
          <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />★{" "}
          {highestStars}
        </span>
      ) : null}
      <MessageSquare className="size-3.5" aria-hidden="true" />
      <span>({count} people reviewed)</span>
    </Link>
  );
};

export default ProductRatingSummary;
