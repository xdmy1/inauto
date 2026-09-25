"use client";

import { useEffect, useRef } from "react";
import { createScene } from "./scene";

// A night sky over the dark part of a dark section with a photo on the right
// (the hero, the footer's visit band): the left side on desktop, the band
// under the photo on phones. With a real pointer the sky leans a few px on a
// spring; the photo and the text never move. Off under prefers-reduced-motion
// or data saver; paused whenever the section is off screen or the tab is
// hidden, so idle cost is zero. The section reads the same without it.

const SPRING_K = 90;
const SPRING_C = 16;

export function HeroFx({
  copy: copySelector = ".hero-copy",
  media: mediaSelector = ".hero-media",
  darkWidth = 0.66,
  fade = [0.47, 0.62],
}: {
  /** the text block (stars dim behind it) */
  copy?: string;
  /** the photo (on phones the sky starts under it) */
  media?: string;
  /** how much of the host, from the left, the sky covers on wide screens */
  darkWidth?: number;
  /** where the sky dissolves toward the photo, as fractions of the host width */
  fade?: [number, number];
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx || saveData) return;

    const copy = host.querySelector<HTMLElement>(copySelector);
    const media = host.querySelector<HTMLElement>(mediaSelector);
    const scene = createScene({ fade });

    // pointer target and the spring that follows it (−1..1 per axis)
    const target = { x: 0, y: 0 };
    const spring = { x: 0, y: 0, vx: 0, vy: 0 };
    let settled = true;

    let running = false;
    let inView = true;
    let visible = document.visibilityState === "visible";
    let raf = 0;
    let last = 0;
    let skip = false;
    let width = 0;
    let height = 0;
    let live = false;

    const size = () => {
      const r = host.getBoundingClientRect();
      const wide = desktop.matches;
      // desktop: the dark left side; phones: the whole hero, stars only below the photo
      width = Math.round(wide ? r.width * darkWidth : r.width);
      height = Math.round(r.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const photoBottom = wide || !media ? 0 : media.getBoundingClientRect().bottom - r.top;
      scene.resize(width, height, wide ? r.width : 0, photoBottom);
      measureCopy();
    };
    let copyTimer = 0;
    const measureCopy = () => {
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        if (!copy) return;
        const h = host.getBoundingClientRect();
        const first = copy.firstElementChild?.getBoundingClientRect();
        const lastEl = copy.lastElementChild?.getBoundingClientRect();
        if (!first || !lastEl) return;
        scene.setCopyRect({
          x: first.left - h.left,
          y: first.top - h.top,
          w: Math.max(...Array.from(copy.children, (el) => el.getBoundingClientRect().right)) - first.left,
          h: lastEl.bottom - first.top,
        });
      }, 120);
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, last ? now - last : 16);
      last = now;

      if (!settled) {
        const s = dt / 1000;
        spring.vx += (SPRING_K * (target.x - spring.x) - SPRING_C * spring.vx) * s;
        spring.vy += (SPRING_K * (target.y - spring.y) - SPRING_C * spring.vy) * s;
        spring.x += spring.vx * s;
        spring.y += spring.vy * s;
        if (
          Math.abs(spring.vx) < 0.01 && Math.abs(spring.vy) < 0.01 &&
          Math.abs(spring.x - target.x) < 0.005 && Math.abs(spring.y - target.y) < 0.005
        ) {
          spring.x = target.x;
          spring.y = target.y;
          spring.vx = spring.vy = 0;
          settled = true;
        }
      }

      // twinkling stars are fine at 30 fps; shooting stars and the spring get 60
      skip = !skip && settled && !scene.busy();
      if (skip) return;
      scene.step(dt + (settled && !scene.busy() ? dt : 0), now);
      ctx.clearRect(0, 0, width, height);
      scene.draw(ctx, now, spring.x, spring.y);
    };

    const sync = () => {
      const should = inView && visible && !reduced.matches;
      if (should && !running) {
        running = true;
        last = 0;
        if (!live) {
          live = true;
          canvas.classList.add("is-live");
        }
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
      if (process.env.NODE_ENV !== "production")
        (window as unknown as { __heroFx?: unknown }).__heroFx = { running, inView, visible, desktop: desktop.matches, pointer: pointerFine.matches };
    };

    const ro = new ResizeObserver(size);
    ro.observe(host);
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    io.observe(host);
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !pointerFine.matches) return;
      const r = host.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      settled = false;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      settled = false;
    };
    const onDesktopChange = () => {
      size();
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    desktop.addEventListener("change", onDesktopChange);
    reduced.addEventListener("change", sync);

    size();
    sync();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(copyTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      desktop.removeEventListener("change", onDesktopChange);
      reduced.removeEventListener("change", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="hero-sky pointer-events-none absolute inset-y-0 left-0"
    />
  );
}
