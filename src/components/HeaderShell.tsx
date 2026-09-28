"use client";

// The sticky bar and its scroll behaviour: shrinks once the page moves,
// slips away while scrolling down, comes back on the first scroll up (or
// when focus lands inside it). Never hides while a menu inside it is open.
// The look itself is in src/app/header.css, keyed off the data attributes.
import { useEffect, useRef, useState } from "react";

const HIDE_AFTER = 220; // px scrolled before hiding is allowed
const STEP = 6; // px of movement that counts as a direction

export function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      setScrolled(y > 8);
      const menuOpen = !!ref.current?.querySelector('[aria-expanded="true"]');
      if (y < HIDE_AFTER || menuOpen) setHidden(false);
      else if (delta > STEP) setHidden(true);
      else if (delta < -STEP) setHidden(false);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    // transitions switch on only after the first read, so a reload mid-page
    // paints the solid bar straight away instead of fading into it
    const t = window.setTimeout(() => setReady(true), 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <header
      ref={ref}
      className="site-header"
      data-ready={ready ? "" : undefined}
      data-scrolled={scrolled ? "" : undefined}
      data-hidden={hidden ? "" : undefined}
      onFocusCapture={() => setHidden(false)}
    >
      <div className="site-header-bar">{children}</div>
    </header>
  );
}
