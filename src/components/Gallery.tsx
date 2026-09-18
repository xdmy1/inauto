"use client";

import { useCallback, useEffect, useState } from "react";
import { imageUrl } from "@/lib/images";
import { CarMark } from "./Logo";

// Main photo + thumbnail strip; arrows, keyboard ← →, swipe on phones.
export function Gallery({
  images,
  alt,
}: {
  images: { path: string }[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const n = images.length;

  const go = useCallback(
    (d: number) => setIndex((i) => (n ? (i + d + n) % n : 0)),
    [n]
  );

  useEffect(() => {
    if (n < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, go]);

  if (n === 0) {
    return (
      <div className="card flex aspect-[4/3] items-center justify-center rounded-2xl text-line">
        <CarMark className="h-16 w-auto" />
      </div>
    );
  }
  const current = images[Math.min(index, n - 1)];

  const arrow =
    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink shadow-lift backdrop-blur transition-all hover:bg-card active:scale-95";

  return (
    <div>
      <div
        className="card relative overflow-hidden rounded-2xl bg-line/40"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX == null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          setTouchX(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.path}
          src={imageUrl(current.path, "lg")}
          alt={`${alt} — ${index + 1}`}
          width={1600}
          height={1200}
          fetchPriority="high"
          className="aspect-[4/3] w-full object-cover"
        />
        {n > 1 && (
          <>
            <button type="button" aria-label="Prev" onClick={() => go(-1)} className={`${arrow} left-3`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <button type="button" aria-label="Next" onClick={() => go(1)} className={`${arrow} right-3`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            <span className="photo-badge photo-badge-ink absolute bottom-3 right-3 h-7 px-2.5 text-xs normal-case tracking-normal">
              {index + 1} / {n}
            </span>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="scroll-row mt-3">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={`w-[104px] shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:w-[120px] ${
                i === index
                  ? "border-accent"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
