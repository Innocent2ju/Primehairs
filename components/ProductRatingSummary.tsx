import Link from "next/link";
import { Star } from "lucide-react";

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
  const rating = hasRating ? Math.min(5, Math.max(0, highestStars)) : 0;

  return (
    <Link
      href={`/products/${slug}/reviews`}
      className={cn(
        "group inline-flex w-fit items-center gap-1.5 text-xs text-light-gray/80 transition-colors hover:text-gold",
        className,
      )}
      aria-label={
        hasRating
          ? `Rated ${rating} out of 5 by ${count} ${count === 1 ? "person" : "people"}`
          : `${count} reviews`
      }
    >
      {hasRating ? (
        <>
          <div className="inline-flex items-center gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((starIndex) => {
              const fillPercentage = Math.max(
                0,
                Math.min(100, (rating - (starIndex - 1)) * 100),
              );

              return (
                <span key={starIndex} className="relative inline-flex size-3.5">
                  {/* Base empty star (Shopify-style muted outline/fill) */}
                  <Star className="size-3.5 fill-light-gray/15 text-light-gray/40" />

                  {/* Clipped filled star for exact & fractional ratings */}
                  {fillPercentage > 0 && (
                    <span
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${fillPercentage}%` }}
                    >
                      <Star className="size-3.5 fill-gold text-gold" />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          <span className="font-medium tabular-nums text-foreground">
            {rating.toFixed(1)}
          </span>
          <span className="tabular-nums text-light-gray/70 group-hover:text-gold/80">
            ({count} review{count === 1 ? "" : "s"})
          </span>
        </>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <Star
                key={starIndex}
                className="size-3.5 fill-transparent text-light-gray/40"
              />
            ))}
          </span>
          <span>({count})</span>
        </span>
      )}
    </Link>
  );
};

export default ProductRatingSummary;