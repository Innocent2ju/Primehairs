"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

import { uploadImages } from "@/lib/admin/actions/product";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;

interface ImageUploadProps {
  /** Every uploaded image; the first one is used as the main product image. */
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const isImageUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export default function ImageUpload({
  value,
  onChange,
  maxFiles = MAX_FILES,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, maxFiles - value.length);

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);

    const selected = Array.from(files);

    if (selected.length === 0) return;

    if (selected.length > remaining) {
      setError(`You can add ${remaining} more image${remaining === 1 ? "" : "s"}.`);
      return;
    }

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 10 MB.`);
        return;
      }
    }

    const formData = new FormData();
    for (const file of selected) formData.append("files", file);

    setIsUploading(true);

    try {
      const result = await uploadImages(formData);

      if (result.status !== "success") {
        setError(result.message);
        return;
      }

      const next = [...value];
      for (const url of result.urls) {
        if (isImageUrl(url) && !next.includes(url)) next.push(url);
      }
      onChange(next.slice(0, maxFiles));
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    void handleFiles(event.dataTransfer.files);
  };

  const remove = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  const makeMain = (url: string) => {
    onChange([url, ...value.filter((item) => item !== url)]);
  };

  const busy = disabled || isUploading;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!busy) inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-gold bg-gold/10"
            : "border-white/20 bg-[#1A1A1A]/60 hover:border-gold/60",
          busy && "cursor-not-allowed opacity-60",
        )}
      >
        {isUploading ? (
          <Loader2 className="size-7 animate-spin text-gold" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-7 text-gold" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-white">
          {isUploading
            ? "Uploading to Cloudinary…"
            : "Drag & drop images, or click to browse"}
        </p>
        <p className="text-[11px] text-light-gray/60">
          JPG, PNG, WEBP or AVIF · up to 10 MB each · {remaining} slot
          {remaining === 1 ? "" : "s"} left
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
          }}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40"
            >
              <img src={url} alt={`Product image ${index + 1}`} className="size-full object-cover" />

              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                  Main
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeMain(url)}
                  title="Use as main image"
                  className="absolute left-2 top-2 cursor-pointer rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:text-gold group-hover:opacity-100"
                >
                  <Star className="size-3.5" aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={() => remove(url)}
                disabled={busy}
                aria-label="Remove image"
                className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:cursor-not-allowed"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
