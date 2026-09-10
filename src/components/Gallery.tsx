"use client";

import { useState } from "react";
import { imageUrl } from "@/lib/images";

export function Gallery({
  images,
  alt,
}: {
  images: { path: string }[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-line bg-card text-ink-faint">
        —
      </div>
    );
  }
  const current = images[Math.min(index, images.length - 1)];

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
        <img
          src={imageUrl(current.path, "lg")}
          alt={alt}
          className="aspect-[4/3] w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Prev"
              onClick={() =>
                setIndex((i) => (i - 1 + images.length) % images.length)
              }
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition-colors hover:bg-ink"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition-colors hover:bg-ink"
            >
              →
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={imageUrl(img.path, "sm")}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
