"use client";

// A mechanical odometer for the dealership's numbers: every digit is a drum
// that rolls into place the first time the figure is on screen — the ones
// drum spins fastest, the hundreds barely move, like the real thing under a
// dashboard. The value is in the HTML from the start (no JS: it just shows),
// each drum has a fixed width so nothing shifts, and under reduced motion
// the drums are simply set.
import { useEffect, useRef } from "react";

const DIGITS = "0123456789";

export function Odometer({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-set");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.classList.add("is-set");
        io.disconnect();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chars = value.split("");
  const digitCount = chars.filter((c) => DIGITS.includes(c)).length;
  let seen = 0;

  return (
    <span ref={ref} className="odo" role="img" aria-label={value}>
      {chars.map((c, i) => {
        if (!DIGITS.includes(c)) {
          return (
            <span key={i} className="odo-char" aria-hidden="true">
              {c === " " ? " " : c}
            </span>
          );
        }
        // full turns before landing: 2 for the last drum, 1 for the one before, 0 above
        const fromEnd = digitCount - 1 - seen++;
        const turns = Math.max(0, 2 - fromEnd);
        const steps = turns * 10 + Number(c);
        return (
          <span key={i} className="odo-cell" aria-hidden="true">
            <span
              className="odo-col"
              style={{ "--n": steps } as React.CSSProperties}
            >
              {Array.from({ length: (turns + 1) * 10 }, (_, k) => (
                <span key={k}>{k % 10}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
