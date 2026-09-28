"use client";

// The road: a hairline across the page and a wheel that rolls along it
// exactly as far as the page is scrolled — no slipping (one turn per
// circumference of travel), rolling back when you scroll up, with a beat
// of inertia on a flick. Behind it the line darkens like a tyre mark.
//
// The wheel paints as an SVG at once; a real 3D alloy (three.js, loaded
// only when the band comes near) crossfades in on top and turns to face
// the pointer. No WebGL, data saver, or a lost context: the SVG keeps
// rolling. Reduced motion: the wheel sits still on the road.
import { useEffect, useRef } from "react";
import { nudge, trackView } from "./scrollEngine";
import type { WheelScene } from "./wheel3d";

// the tyre spans this much of the box (camera framing / SVG geometry)
const TYRE = 0.87;

export function RoadWheel() {
  const bandRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    const wheelEl = wheelRef.current;
    const mark = markRef.current;
    const canvas = canvasRef.current;
    if (!band || !wheelEl || !mark || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

    let size = 0;
    let track = 0;
    const measure = () => {
      size = wheelEl.offsetWidth;
      track = Math.max(0, band.clientWidth - size);
    };
    measure();

    const place = (x: number) => {
      wheelEl.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      mark.style.transform = `scaleX(${((x + size / 2) / (track + size || 1)).toFixed(4)})`;
    };

    if (reduced) {
      place(track * 0.3);
      return;
    }

    let scene: WheelScene | null = null;
    let progress = 0;
    let turns = 0;

    const apply = (p: number) => {
      progress = p;
      // the trip happens while the band is comfortably on screen: it starts
      // once the band is clear of the bottom edge and ends before the band
      // slides under the sticky header
      const x = Math.min(1, Math.max(0, (p - 0.1) / 0.72)) * track;
      turns = x / (Math.PI * size * TYRE);
      place(x);
      wheelEl.style.setProperty("--turn", `${(turns * 360).toFixed(2)}deg`);
      scene?.setRoll(-turns * Math.PI * 2);
    };
    const untrack = trackView(band, apply, { stiffness: 8 });

    const ro = new ResizeObserver(() => {
      measure();
      scene?.resize(size);
      apply(progress);
      nudge();
    });
    ro.observe(band);

    // 3D: load once the band is within reach; render only while it is on screen
    let visible = false;
    let cancelled = false;
    const onScreen = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        scene?.setActive(visible && document.visibilityState === "visible");
      },
      { rootMargin: "80px 0px" }
    );
    onScreen.observe(band);

    const load = async () => {
      try {
        const { createWheel } = await import("./wheel3d");
        if (cancelled) return;
        scene = createWheel(canvas, size, () => {
          band.classList.remove("has-3d");
          scene = null;
        });
        if (!scene) return;
        scene.setRoll(-turns * Math.PI * 2);
        scene.setActive(visible && document.visibilityState === "visible");
        band.classList.add("has-3d");
      } catch {
        // the SVG wheel stays
      }
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        if (!saveData) load();
      },
      { rootMargin: "900px 0px" }
    );
    near.observe(band);

    const onVisibility = () =>
      scene?.setActive(visible && document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    // the wheel turns toward a real pointer
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!scene) return;
      const r = band.getBoundingClientRect();
      scene.setTilt(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => scene?.setTilt(0, 0);
    if (fine) {
      band.addEventListener("pointermove", onMove, { passive: true });
      band.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelled = true;
      untrack();
      ro.disconnect();
      onScreen.disconnect();
      near.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      band.removeEventListener("pointermove", onMove);
      band.removeEventListener("pointerleave", onLeave);
      scene?.dispose();
      scene = null;
    };
  }, []);

  return (
    <div ref={bandRef} className="road" aria-hidden="true">
      <div className="road-line">
        <span ref={markRef} className="road-mark" />
      </div>
      <div ref={wheelRef} className="road-wheel">
        <span className="road-shadow" />
        <WheelSvg />
        <canvas ref={canvasRef} className="road-canvas" />
      </div>
    </div>
  );
}

// Front view of the same wheel: tyre, polished lip, twin five-spoke face,
// red cap; the brake disc and caliper sit behind and do not turn.
function WheelSvg() {
  const c = 50;
  const cy = 53;
  const R = 50 * TYRE;
  const blades = [];
  for (let i = 0; i < 5; i++) {
    for (const s of [-1, 1]) {
      blades.push(
        <polygon
          key={`${i}${s}`}
          points="-3.1,-8 3.1,-8 2.2,-33 -2.2,-33"
          transform={`rotate(${i * 72 + s * 7.2})`}
        />
      );
    }
  }
  const nuts = [];
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 + 36) * Math.PI) / 180;
    nuts.push(<circle key={i} cx={Math.cos(a) * 7.4} cy={Math.sin(a) * 7.4} r="1.35" fill="#2a2d36" />);
  }
  return (
    <svg className="road-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="rw-tyre" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#2a2b31" />
          <stop offset="88%" stopColor="#1b1c21" />
          <stop offset="100%" stopColor="#111216" />
        </radialGradient>
        <linearGradient id="rw-alloy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f3f5" />
          <stop offset="0.5" stopColor="#c9ccd3" />
          <stop offset="1" stopColor="#9a9ea9" />
        </linearGradient>
        <linearGradient id="rw-barrel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3d47" />
          <stop offset="1" stopColor="#1d1f26" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={cy} r={R} fill="url(#rw-tyre)" />
      <circle cx={c} cy={cy} r={R * 0.8} fill="url(#rw-barrel)" />
      {/* brake disc + caliper: static */}
      <circle cx={c} cy={cy} r={R * 0.62} fill="#4b4f5a" />
      <circle cx={c} cy={cy} r={R * 0.33} fill="#2a2d36" />
      <path
        d={`M ${c + Math.cos(-2.45) * 18} ${cy + Math.sin(-2.45) * 18} A 18 18 0 0 1 ${c + Math.cos(-1.65) * 18} ${cy + Math.sin(-1.65) * 18} L ${c + Math.cos(-1.65) * 26} ${cy + Math.sin(-1.65) * 26} A 26 26 0 0 0 ${c + Math.cos(-2.45) * 26} ${cy + Math.sin(-2.45) * 26} Z`}
        fill="#e0192b"
      />
      {/* everything that turns */}
      <g className="road-svg-roll" transform={`translate(${c} ${cy})`}>
        <g fill="url(#rw-alloy)">{blades}</g>
        <circle r={R * 0.8} fill="none" stroke="url(#rw-alloy)" strokeWidth="2.6" />
        <circle r="10" fill="url(#rw-alloy)" />
        {nuts}
        <circle r="4" fill="#e0192b" stroke="#f4f5f7" strokeWidth="0.7" />
      </g>
    </svg>
  );
}
