"use client";

import { useEffect, useRef, useState } from "react";
import { imageSrcSet, imageUrl } from "@/lib/images";

// The first photos of a car, right on the card: swipe on phones, arrows in
// the bottom-right corner everywhere. Lives inside the card's link — the
// arrows stop the click, a swipe is just a scroll, a tap still opens the car.
export function CardGallery({
  images,
  alt,
  priority = false,
  dim = false,
  labels,
}: {
  images: { path: string }[];
  alt: string;
  priority?: boolean;
  dim?: boolean;
  labels: { prev: string; next: string };
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // the other photos load once the visitor shows interest in the card
  const [warm, setWarm] = useState(false);
  const n = images.length;

  useEffect(() => {
    const el = strip.current;
    if (!el || n < 2) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / el.clientWidth)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = strip.current;
    if (!el) return;
    setWarm(true);
    const next = (index + d + n) % n;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  const sizes = "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw";

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={() => setWarm(true)}
      onTouchStart={() => setWarm(true)}
    >
      <div
        ref={strip}
        className={`card-strip flex h-full w-full ${n > 1 ? "snap-x snap-mandatory overflow-x-auto" : "overflow-hidden"}`}
      >
        {images.map((img, i) => (
          <div key={img.path} className="h-full w-full shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(img.path, "md")}
              srcSet={imageSrcSet(img.path)}
              sizes={sizes}
              alt={i === 0 ? alt : `${alt} — ${i + 1}`}
              width={640}
              height={480}
              loading={i === 0 && priority ? "eager" : i === 0 || warm ? "eager" : "lazy"}
              fetchPriority={i === 0 && priority ? "high" : undefined}
              draggable={false}
              className={`h-full w-full object-cover ${dim ? "grayscale-[35%]" : ""}`}
            />
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="photo-badge photo-badge-ink absolute bottom-2.5 right-2.5 h-7 gap-0 px-0 normal-case tracking-normal">
          <button
            type="button"
            aria-label={labels.prev}
            onClick={(e) => go(e, -1)}
            className="flex h-7 w-7 items-center justify-center rounded-l-md transition-colors hover:bg-white/15 active:bg-white/25"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <span className="min-w-[30px] text-center text-[11px] tabular-nums" aria-live="polite">
            {index + 1}/{n}
          </span>
          <button
            type="button"
            aria-label={labels.next}
            onClick={(e) => go(e, 1)}
            className="flex h-7 w-7 items-center justify-center rounded-r-md transition-colors hover:bg-white/15 active:bg-white/25"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
