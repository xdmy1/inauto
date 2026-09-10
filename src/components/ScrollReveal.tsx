"use client";

// Scroll-reveal: elements marked data-reveal fade+rise in when they enter
// the viewport, staggered between siblings. Content stays in the HTML —
// hiding only activates once JS sets data-anim on <html>.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const parent = el.parentElement;
          let delay = 0;
          if (parent) {
            const pending = Array.from(parent.children).filter(
              (c) =>
                c.hasAttribute("data-reveal") &&
                !c.classList.contains("is-revealed")
            );
            delay = Math.min(pending.indexOf(el), 5) * 70;
          }
          if (delay > 0) el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-revealed");
          io.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    document
      .querySelectorAll("[data-reveal]:not(.is-revealed)")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
