"use client";

import { useState } from "react";

interface ProductGalleryProps {
  name: string;
  variants: string[];
}

const ProductGallery = ({ name, variants }: ProductGalleryProps) => {
  const [activeImage, setActiveImage] = useState(variants[0] ?? "");

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {/* Variant Thumbnails: underneath on small screens, left on md+ screens */}
      <ul className="flex flex-row gap-3 md:flex-col md:gap-4">
        {variants.map((variant, index) => (
          <li key={`${variant}-${index}`}>
            <button
              type="button"
              onClick={() => setActiveImage(variant)}
              aria-label={`${name} view ${index + 1}`}
              aria-pressed={activeImage === variant}
              className={`block w-20 cursor-pointer overflow-hidden rounded-lg border transition-colors sm:w-24 ${
                activeImage === variant ? "border-gold" : "border-white/10"
              }`}
            >
              <img
                src={variant}
                alt=""
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
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default ProductGallery;