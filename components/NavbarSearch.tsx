"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { wigs } from "@/lib/constants";

export default function NavbarSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut "/" to focus search and "Escape" to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter matching wigs based on name, category, or description
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return wigs.filter(
      (wig) =>
        wig.name.toLowerCase().includes(trimmed) ||
        wig.category.toLowerCase().includes(trimmed) ||
        wig.description.toLowerCase().includes(trimmed)
    );
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search hairs..."
          aria-label="Search hairs"
          className="w-28 sm:w-44 md:w-56 pl-7 sm:pl-8 pr-6 py-1 bg-black/60 text-white placeholder-light-gray/40 rounded-full border border-[#1A1A1A]/40 focus:border-gold focus:w-40 md:focus:w-64 focus:outline-none text-xs transition-all"
        />
        <Search className="w-3.5 h-3.5 text-gold absolute left-2 pointer-events-none" />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 text-light-gray/60 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="hidden md:inline-block absolute right-2 text-[10px] text-light-gray/40 border border-white/10 rounded px-1 pointer-events-none">
            /
          </span>
        )}
      </div>

      {/* Dropdown Results Popover */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 md:w-96 rounded-xl bg-[#1A1A1A]/95 border border-gold/30 backdrop-blur-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/10">
          <div className="p-3">
            <div className="flex items-center justify-between text-xs text-light-gray mb-2">
              <span>Matching hairs</span>
              <span className="text-[10px] text-gold font-medium">
                {results.length} found
              </span>
            </div>

            {results.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {results.map((wig) => (
                  <Link
                    key={wig.id}
                    href={`/products/${wig.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative w-11 h-11 rounded-md overflow-hidden bg-black shrink-0">
                      <Image
                        src={wig.image}
                        alt={wig.name}
                        fill
                        sizes="44px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate group-hover:text-gold transition-colors font-playfair">
                        {wig.name}
                      </p>
                      <p className="text-[10px] text-light-gray/60">
                        {wig.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gold">
                        ${wig.price.toFixed(2)}
                      </p>
                      <span className={`pill text-[9px] px-1.5 py-0 ${!wig.inStock ? "opacity-70" : ""}`}>
                        {wig.inStock ? "In Stock" : "Sold Out"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-light-gray/60">
                No wigs found matching &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
