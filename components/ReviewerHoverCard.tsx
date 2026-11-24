"use client";

import { useState } from "react";

interface Props {
  name: string;
  maskedEmail: string;
  orderCount: number;
  signupDate: string | null;
}

const formatSignupDate = (value: string | null): string => {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(date);
};

/**
 * Reviewer name with a masked email; hovering or focusing the name reveals a
 * compact card with their order count and signup date.
 */
const ReviewerHoverCard = ({
  name,
  maskedEmail,
  orderCount,
  signupDate,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="cursor-help text-left text-sm font-medium text-light-gray underline-offset-4 hover:text-gold focus-visible:text-gold focus-visible:outline-none"
        aria-expanded={isOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
      >
        {name} ({maskedEmail})
      </button>

      {isOpen ? (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-20 mb-2 flex w-56 flex-col gap-1 rounded-lg border border-gold/20 bg-[#1A1A1A] p-3 text-xs text-light-gray/80 shadow-lg"
        >
          <span className="text-sm font-semibold text-white">{name}</span>
          <span>{maskedEmail}</span>
          <span>
            <span className="text-light-gray/50">Orders: </span>
            {orderCount}
          </span>
          <span>
            <span className="text-light-gray/50">Joined: </span>
            {formatSignupDate(signupDate)}
          </span>
        </span>
      ) : null}
    </span>
  );
};

export default ReviewerHoverCard;
