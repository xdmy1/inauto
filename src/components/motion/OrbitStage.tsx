"use client";

// The orbit: one pinned, full-viewport moment where scrolling walks the
// camera around the same white BMW, on the same glossy floor, under the same
// sign as the hero. The footage is a frame sequence drawn to a canvas: a
// <video> element seeks too slowly and too unevenly on iOS Safari to be
// scrubbed by hand, while a decoded frame lands on the very next paint. The
// frames load only once the section comes within a viewport, coarse first
// (every 8th, then every 4th, 2nd, the rest), so the scrub works within a
// second and sharpens as the rest arrive. The scrub carries a beat of
// inertia, like turning something heavy. Three real promises and the
// catalogue CTA arrive at set points along the turn; on desktops a small
// dial in the corner shows where the camera stands, on phones a slim bar
// under the copy shows how far the turn has gone.
//
// Phones get a short run (about one swipe) so the turn feels quick, the
// footage centred in the stage and the copy set over the reflective floor
// at its foot; desktops walk the camera over a longer scroll with the copy
// on the left.
//
// No JS, data saver or reduced motion: the same section as a still photo
// with the copy laid out plainly (the markup below is that layout; the
// `is-live` class turns it into the stage).
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "@/components/icons";

export type OrbitFrames = {
  /** folder under /public, frames are 000.webp … */
  dir: string;
  count: number;
  width: number;
  height: number;
  poster: string;
};

export type OrbitBeat = { title: string; text: string };

// where along the scroll each caption is on (progress 0..1)
type Timing = { titleUntil: number; beats: [number, number][]; endFrom: number };
const TIMING_WIDE: Timing = {
  titleUntil: 0.08,
  beats: [
    [0.12, 0.34],
    [0.37, 0.59],
    [0.62, 0.84],
  ],
  endFrom: 0.87,
};
// phones: the whole run is about a swipe, so the title leaves as soon as
// the turn starts and the three beats share the middle evenly
const TIMING_PHONE: Timing = {
  titleUntil: 0.1,
  beats: [
    [0.12, 0.34],
    [0.36, 0.58],
    [0.6, 0.82],
  ],
  endFrom: 0.84,
};
// lerp stiffness of the scrub (larger settles faster)
const K = 11;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// coarse frames first so the scrub is usable at once, then the gaps
function loadOrder(n: number) {
  const seen = new Set<number>();
  const out: number[] = [];
  const push = (i: number) => {
    if (i >= 0 && i < n && !seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  };
  push(0);
  push(n - 1);
  for (const step of [8, 4, 2, 1]) for (let i = 0; i < n; i += step) push(i);
  return out;
}

export function OrbitStage({
  desktop,
  mobile,
  title,
  hint,
  beats,
  endLine,
  cta,
  ctaHref = "/auto",
  sweep = 140,
}: {
  desktop: OrbitFrames;
  mobile: OrbitFrames;
  title: string;
  hint: string;
  beats: OrbitBeat[];
  endLine: string;
  cta: string;
  ctaHref?: string;
  /** degrees the camera dial turns over the whole scrub */
  sweep?: number;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    const dot = dotRef.current;
    const bar = barRef.current;
    if (!section || !stage || !media || !canvas || !dot || !bar) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (saveData) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    section.classList.add("is-live");
    const caps = Array.from(stage.querySelectorAll<HTMLElement>(".orbit-cap"));
    const narrow = window.matchMedia("(max-width: 767px)");

    let set = narrow.matches ? mobile : desktop;
    let timing = narrow.matches ? TIMING_PHONE : TIMING_WIDE;
    let frames: (HTMLImageElement | null)[] = [];
    let loading = false;
    let generation = 0;
    let p = 0;
    let target = 0;
    let run = 1;
    let drawn = -1;
    let capOn = "";
    let raf = 0;
    let last = 0;
    let near = false;

    const src = (i: number) => `${set.dir}/${String(i).padStart(3, "0")}.webp`;

    const nearest = (i: number) => {
      const n = frames.length;
      if (frames[i]) return i;
      for (let d = 1; d < n; d++) {
        if (i - d >= 0 && frames[i - d]) return i - d;
        if (i + d < n && frames[i + d]) return i + d;
      }
      return -1;
    };

    const draw = (force: boolean) => {
      const n = frames.length;
      if (!n) return;
      const want = Math.round(p * (n - 1));
      const idx = nearest(want);
      if (idx < 0) return;
      if (!force && idx === drawn) return;
      drawn = idx;
      const img = frames[idx]!;
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / set.width, ch / set.height);
      const dw = set.width * s;
      const dh = set.height * s;
      // cover: crop from the floor and the sides evenly, never the sign
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * 0.4, dw, dh);
      if (!canvas.classList.contains("is-on")) canvas.classList.add("is-on");
    };

    const size = () => {
      const r = media.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        draw(true);
      }
      run = Math.max(1, section.offsetHeight - stage.offsetHeight);
    };

    const captions = () => {
      let key = "";
      if (p < timing.titleUntil) key = "title";
      else if (p >= timing.endFrom) key = "end";
      else {
        const i = timing.beats.findIndex(([a, b]) => p >= a && p < b);
        if (i >= 0) key = String(i);
      }
      if (key === capOn) return;
      capOn = key;
      for (const c of caps) c.classList.toggle("is-on", c.dataset.cap === key);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.064, last ? (now - last) / 1000 : 0.016);
      last = now;
      // read
      target = clamp01(-section.getBoundingClientRect().top / run);
      // ease
      const d = target - p;
      if (Math.abs(d) < 0.0005) p = target;
      else p += d * (1 - Math.exp(-K * dt));
      // write
      draw(false);
      captions();
      dot.style.transform = `rotate(${(-sweep / 2 + p * sweep).toFixed(1)}deg)`;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      if (p !== target) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        last = 0;
      }
    };
    const schedule = () => {
      if (!raf && near) raf = requestAnimationFrame(tick);
    };

    // frames: only once the section is within a viewport of the screen
    const load = async () => {
      if (loading) return;
      loading = true;
      const gen = ++generation;
      const n = set.count;
      frames = new Array(n).fill(null);
      const queue = loadOrder(n);
      const worker = async () => {
        while (queue.length && gen === generation) {
          const i = queue.shift()!;
          const img = new Image();
          img.decoding = "async";
          img.src = src(i);
          try {
            if (img.decode) await img.decode();
            else await new Promise<void>((res, rej) => ((img.onload = () => res()), (img.onerror = () => rej())));
          } catch {
            continue;
          }
          if (gen !== generation) return;
          frames[i] = img;
          // the frame the scrub wants (or a closer one) just landed
          const want = Math.round(p * (n - 1));
          if (drawn < 0 || Math.abs(i - want) < Math.abs(drawn - want)) draw(true);
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
    };

    const io = new IntersectionObserver(
      (entries) => {
        near = entries.some((e) => e.isIntersecting);
        if (near) {
          load();
          schedule();
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(section);

    const ro = new ResizeObserver(() => {
      size();
      schedule();
    });
    ro.observe(media);
    ro.observe(section);

    // phones and desktops get different crops and timings; swap them if the class changes
    const onNarrow = () => {
      timing = narrow.matches ? TIMING_PHONE : TIMING_WIDE;
      capOn = "";
      const next = narrow.matches ? mobile : desktop;
      if (next === set) return;
      set = next;
      loading = false;
      drawn = -1;
      generation++;
      frames = [];
      canvas.classList.remove("is-on");
      if (near) load();
    };
    narrow.addEventListener("change", onNarrow);

    window.addEventListener("scroll", schedule, { passive: true });
    size();
    schedule();

    return () => {
      generation++;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      narrow.removeEventListener("change", onNarrow);
      window.removeEventListener("scroll", schedule);
      section.classList.remove("is-live");
    };
  }, [desktop, mobile, sweep]);

  return (
    <section ref={sectionRef} className="orbit" aria-labelledby="orbit-title">
      <div ref={stageRef} className="orbit-stage">
        <div ref={mediaRef} className="orbit-media" aria-hidden="true">
          <picture>
            <source media="(max-width: 767px)" srcSet={mobile.poster} />
            <img
              src={desktop.poster}
              alt=""
              width={desktop.width}
              height={desktop.height}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <canvas ref={canvasRef} className="orbit-canvas" />
          {/* the same even veil as the hero, heavier where the copy sits */}
          <div className="orbit-scrim" />
        </div>

        <div className="orbit-ui">
          <div className="orbit-cap orbit-head" data-cap="title">
            <h2 id="orbit-title" className="orbit-title">
              {title}
            </h2>
            <p className="orbit-hint">
              <span className="orbit-hint-mouse" aria-hidden="true">
                <span />
              </span>
              {hint}
            </p>
          </div>

          <ol className="orbit-beats">
            {beats.map((b, i) => (
              <li key={i} className="orbit-cap orbit-beat" data-cap={String(i)}>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </li>
            ))}
          </ol>

          <div className="orbit-cap orbit-end" data-cap="end">
            <p className="orbit-end-line">{endLine}</p>
            <Link href={ctaHref} className="btn-primary">
              {cta}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* phones: how far the turn has gone, as a slim line under the copy */}
          <span className="orbit-bar" aria-hidden="true">
            <span ref={barRef} className="orbit-bar-fill" />
          </span>

          {/* desktops: the camera's place around the car, from above */}
          <div className="orbit-dial" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
              <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="1 5.06" />
              {/* the car from above, nose down toward the camera's dot */}
              <rect x="26.5" y="19" width="11" height="26" rx="3.4" fill="currentColor" fillOpacity="0.92" />
              <path d="M28.6 23.2h6.8l-0.9 3.2h-5z" fill="#10131f" fillOpacity="0.7" />
              <path d="M28 33.4h8l0.8 4h-9.6z" fill="#10131f" fillOpacity="0.75" />
              <circle cx="29.2" cy="43.4" r="0.9" fill="#ffd98a" />
              <circle cx="34.8" cy="43.4" r="0.9" fill="#ffd98a" />
            </svg>
            <span ref={dotRef} className="orbit-dial-arm">
              <span className="orbit-dial-dot" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
