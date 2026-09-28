"use client";

// Publishes the parent element's eased view progress as the CSS variable
// --p (0..1) on a display:contents wrapper, so plain CSS underneath can be
// scroll-linked (a steering wheel that turns as the card passes through the
// viewport, say). Nothing happens under reduced motion: --p stays unset and
// the CSS falls back to its resting value.
import { useEffect, useRef } from "react";
import { trackView } from "./scrollEngine";

export function ScrollVar({
  children,
  stiffness,
}: {
  children: React.ReactNode;
  stiffness?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return trackView(host, (p) => el.style.setProperty("--p", p.toFixed(4)), { stiffness });
  }, [stiffness]);

  return (
    <span ref={ref} style={{ display: "contents" }}>
      {children}
    </span>
  );
}
