"use client";

// The orbit: one pinned, full-viewport moment where scrolling walks the
// camera around the same white BMW, on the same glossy floor, under the same
// sign as the hero. The footage is a frame sequence drawn to a canvas: a
// <video> element seeks too slowly and too unevenly on iOS Safari to be
// scrubbed by hand, while a decoded frame lands on the very next paint. The
// frames load only once the section comes within a viewport, coarse first
// (every 8th, then every 4th, 2nd, the rest), so the scrub works within a
// second and sharpens as the rest arrive. The scrub carries a beat of
// inertia, like turning something heavy, and the two frames either side of
// the scrub position are crossfaded, so a slow wheel or trackpad scroll
// glides instead of stepping from frame to frame.
//
// The copy is not a slideshow: the three promises are on the stage from the
// start, dim, and each lights up at its point along the turn and stays lit,
// so the story is whole even after a fast flick through the section. The
// catalogue CTA arrives at the end and stays too. A live read-out of the
// camera's angle ticks with the turn; on desktops it sits beside a small
// dial at the top right, on phones it heads the stage under the title.
//
// Phones get the footage full-screen: the frame fits the width and its own
// top and bottom rows run on to the edges of the stage (the ribbed wall up,
// the glossy floor down), fading into the ink where the copy sits. The
// desktop frames are 16:9 and simply cover the stage.
//
// No JS, data saver or reduced motion: the same section as a still photo
// with the copy laid out plainly (the markup below is that layout; the
// `is-live` class turns it into the stage).
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { track } from "@/lib/analytics";

export type OrbitFrames = {
  /** folder under /public, frames are 000.webp … */
  dir: string;
  count: number;
  width: number;
  height: number;
  poster: string;
};

export type OrbitBeat = { title: string; text: string };

// where along the scroll (progress 0..1) each promise lights up and the CTA
// arrives; once lit they stay
type Timing = { beats: number[]; end: number };
const TIMING_WIDE: Timing = { beats: [0.14, 0.42, 0.7], end: 0.9 };
const TIMING_PHONE: Timing = { beats: [0.14, 0.42, 0.7], end: 0.88 };
// the scroll hint leaves once the turn has begun
const MOVING_FROM = 0.03;
// lerp stiffness of the scrub (larger settles faster)
const K = 8;
// redraw once the scrub has moved this much of a frame
const REDRAW_STEP = 0.015;
// rows of the frame smeared up and down to fill a phone's stage
const EDGE_ROWS = 4;
// share of the spare height that goes above the frame on phones
const PHONE_TOP_SHARE = 0.56;

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
  angleLabel,
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
  angleLabel: string;
  beats: OrbitBeat[];
  endLine: string;
  cta: string;
  ctaHref?: string;
  /** degrees the camera turns over the whole scrub */
  sweep?: number;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const degRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    const dot = dotRef.current;
    const deg = degRef.current;
    const end = endRef.current;
    if (!section || !stage || !media || !canvas || !dot || !deg || !end) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (saveData) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    section.classList.add("is-live");
    const beatEls = Array.from(stage.querySelectorAll<HTMLElement>(".orbit-beat"));
    const narrow = window.matchMedia("(max-width: 767px)");

    let set = narrow.matches ? mobile : desktop;
    let timing = narrow.matches ? TIMING_PHONE : TIMING_WIDE;
    let frames: (HTMLImageElement | null)[] = [];
    let loading = false;
    let generation = 0;
    let p = 0;
    let target = 0;
    let run = 1;
    // what the canvas shows: the fractional frame and the two frames mixed
    let drawnF = -1;
    let drawnA = -1;
    let drawnB = -1;
    let nowOn = -2;
    let endOn = false;
    let movingOn = false;
    let degOn = -1;
    let raf = 0;
    let last = 0;
    let near = false;

    const src = (i: number) => `${set.dir}/${String(i).padStart(3, "0")}.webp`;

    // the nearest loaded frame at or below / at or above an index
    const below = (i: number) => {
      for (let k = Math.min(i, frames.length - 1); k >= 0; k--) if (frames[k]) return k;
      return -1;
    };
    const above = (i: number) => {
      for (let k = Math.max(0, i); k < frames.length; k++) if (frames[k]) return k;
      return -1;
    };

    // one frame onto the canvas, at the given opacity
    const paint = (img: HTMLImageElement, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.globalAlpha = alpha;
      const fitH = Math.round((set.height * cw) / set.width);
      if (narrow.matches && fitH < ch) {
        // phones: the frame fits the width; above and below it the frame's
        // own edge rows are stretched to the stage's edges, so the wall's
        // ribs run on upward and the floor's reflections streak downward
        const top = Math.round((ch - fitH) * PHONE_TOP_SHARE);
        const bottom = ch - top - fitH;
        if (top > 0) ctx.drawImage(img, 0, 0, set.width, EDGE_ROWS, 0, 0, cw, top + 1);
        if (bottom > 0) {
          ctx.drawImage(img, 0, set.height - EDGE_ROWS, set.width, EDGE_ROWS, 0, top + fitH - 1, cw, bottom + 1);
        }
        ctx.drawImage(img, 0, top, cw, fitH);
      } else {
        // cover: crop from the floor and the sides evenly, never the sign
        const s = Math.max(cw / set.width, ch / set.height);
        const dw = set.width * s;
        const dh = set.height * s;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * 0.4, dw, dh);
      }
      ctx.globalAlpha = 1;
    };

    const draw = (force: boolean) => {
      const n = frames.length;
      if (!n) return;
      const f = p * (n - 1);
      const i0 = Math.min(n - 1, Math.floor(f));
      let a = below(i0);
      let b = f - i0 > 0.001 ? above(i0 + 1) : a;
      if (a < 0 && b < 0) return;
      if (a < 0) a = b;
      else if (b < 0) b = a;
      if (!force && a === drawnA && b === drawnB && Math.abs(f - drawnF) < REDRAW_STEP) return;
      drawnF = f;
      drawnA = a;
      drawnB = b;
      // the two loaded frames either side of the scrub, mixed by where it
      // lies between them (while the sequence is still coarse the mix spans
      // the gap, so the turn is smooth even before every frame is in)
      const t = b > a ? (f - a) / (b - a) : 0;
      paint(frames[a]!, 1);
      if (t > 0.004) paint(frames[b]!, t);
      if (!canvas.classList.contains("is-on")) canvas.classList.add("is-on");
    };

    const size = () => {
      const r = media.getBoundingClientRect();
      // phones draw twice per paint and their frames are 640 wide: a 1.5×
      // backing keeps every paint cheap without a visible loss
      const dpr = Math.min(narrow.matches ? 1.5 : 2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        draw(true);
      }
      run = Math.max(1, section.offsetHeight - stage.offsetHeight);
    };

    // the copy: promises light up as the turn reaches them and stay lit
    let reached = -1;
    let finished = false;
    const copy = () => {
      const moving = p >= MOVING_FROM;
      if (moving !== movingOn) {
        movingOn = moving;
        section.classList.toggle("is-moving", moving);
      }
      let now = -1;
      for (let i = 0; i < beatEls.length; i++) if (p >= (timing.beats[i] ?? 2)) now = i;
      if (now !== nowOn) {
        // how far into the story people get (each beat once per visit)
        if (now > reached) {
          reached = now;
          track("orbit_progress", { step: now + 1, of: beatEls.length });
        }
        nowOn = now;
        beatEls.forEach((el, i) => {
          el.classList.toggle("is-on", i <= now);
          el.classList.toggle("is-now", i === now);
        });
      }
      const atEnd = p >= timing.end;
      if (atEnd !== endOn) {
        if (atEnd && !finished) {
          finished = true;
          track("orbit_complete", {});
        }
        endOn = atEnd;
        end.classList.toggle("is-on", atEnd);
      }
      const d = Math.round(p * sweep);
      if (d !== degOn) {
        degOn = d;
        deg.textContent = String(d);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.064, last ? (now - last) / 1000 : 0.016);
      last = now;
      // read
      target = clamp01(-section.getBoundingClientRect().top / run);
      // ease
      const d = target - p;
      if (Math.abs(d) < 0.0003) p = target;
      else p += d * (1 - Math.exp(-K * dt));
      // write
      draw(false);
      copy();
      dot.style.transform = `rotate(${(-sweep / 2 + p * sweep).toFixed(1)}deg)`;
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
          // redraw when the frame that landed is nearer the scrub than what
          // is showing, or falls inside the pair being mixed
          const f = p * (n - 1);
          if (drawnF < 0 || Math.abs(i - f) < 1 || (i > drawnA && i < drawnB)) draw(true);
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
      nowOn = -2;
      endOn = false;
      const next = narrow.matches ? mobile : desktop;
      if (next === set) return;
      set = next;
      loading = false;
      drawnF = -1;
      drawnA = -1;
      drawnB = -1;
      generation++;
      frames = [];
      canvas.classList.remove("is-on");
      size();
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
      section.classList.remove("is-live", "is-moving");
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
          <div className="orbit-copy">
            <div className="orbit-head">
              <h2 id="orbit-title" className="orbit-title">
                {title}
              </h2>
              <p className="orbit-hint">
                <span className="orbit-hint-mouse" aria-hidden="true">
                  <span />
                </span>
                {hint}
              </p>
              {/* the camera's angle, live */}
              <div className="orbit-angle" aria-hidden="true">
                <span className="orbit-angle-num">
                  <span ref={degRef}>0</span>°
                </span>
                <span className="orbit-angle-label">{angleLabel}</span>
              </div>
            </div>

            <ol className="orbit-beats">
              {beats.map((b, i) => (
                <li key={i} className="orbit-beat">
                  <span className="orbit-beat-i" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </li>
              ))}
            </ol>

            <div ref={endRef} className="orbit-end">
              <p className="orbit-end-line">{endLine}</p>
              <Link href={ctaHref} className="btn-primary">
                {cta}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

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
