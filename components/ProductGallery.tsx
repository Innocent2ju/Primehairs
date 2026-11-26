"use client";

import { useEffect, useRef, useState } from "react";

interface ProductGalleryProps {
  name: string;
  variants: string[];
}

const ProductGallery = ({ name, variants }: ProductGalleryProps) => {
  const [activeImage, setActiveImage] = useState(variants[0] ?? "");
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = variants.findIndex((variant) => variant === activeImage);
    if (activeIndex >= 0) {
      thumbRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeImage, variants]);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {/* Variant Thumbnails: horizontal scroll strip on small screens, vertical column on md+ */}
      <ul
        className="flex w-full max-w-full flex-row gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin] md:w-24 md:flex-col md:gap-4 md:overflow-visible md:pb-0 md:pr-0 md:snap-none [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {variants.map((variant, index) => (
          <li
            key={`${variant}-${index}`}
            className="shrink-0 snap-start md:w-full"
          >
            <button
              ref={(el) => {
                thumbRefs.current[index] = el;
              }}
              type="button"
              onClick={() => setActiveImage(variant)}
              aria-label={`${name} view ${index + 1}`}
              aria-pressed={activeImage === variant}
              className={`block w-20 cursor-pointer overflow-hidden rounded-lg border transition-colors sm:w-24 md:w-full ${
                activeImage === variant ? "border-gold" : "border-white/10"
              }`}
            >
              <img
                src={variant}
                alt={`${name} product photo ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Main Active Image */}
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-charcoal card-shadow">
        <img
          src={activeImage}
          alt={`${name} — selected product photo`}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default ProductGallery;