"use client";

// Scroll-reveal: elements marked data-reveal fade+rise in when they enter
// the viewport, staggered between siblings. Content stays in the HTML —
// hiding only activates once JS sets data-anim on <html>.
// New elements are picked up as they appear (page 2, a filter change, a
// client navigation), so nothing can be left hidden.
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = (root: ParentNode) =>
      Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)"));

    if (reduced) {
      const showAll = () => pending(document).forEach((el) => el.classList.add("is-revealed"));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const parent = el.parentElement;
          let delay = 0;
          if (parent) {
            const siblings = Array.from(parent.children).filter(
              (c) => c.hasAttribute("data-reveal") && !c.classList.contains("is-revealed")
            );
            delay = Math.min(siblings.indexOf(el), 5) * 70;
          }
          if (delay > 0) el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-revealed");
          io.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    pending(document).forEach((el) => io.observe(el));

    // watch for elements added later (pagination, filters, navigation)
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.hasAttribute("data-reveal") && !node.classList.contains("is-revealed")) io.observe(node);
          pending(node).forEach((el) => io.observe(el));
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
