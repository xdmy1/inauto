// One scroll listener for every scroll-linked element on the page.
//
// Each subscriber gets a "view progress": 0 when its top edge reaches the
// bottom of the viewport, 1 when its bottom edge leaves the top. The raw
// value is eased toward with an exponential lerp so a flick keeps the
// element moving for a beat and settles softly — the inertia is what makes
// it feel like a physical thing and not a scrollbar. The loop only runs
// while something is still settling; idle cost is zero. Reads happen before
// any write in a frame, so nothing forces layout twice.

type Entry = {
  el: HTMLElement;
  cb: (p: number) => void;
  /** lerp stiffness — larger settles faster */
  k: number;
  p: number;
  target: number;
  started: boolean;
};

const entries = new Set<Entry>();
let raf = 0;
let last = 0;
let listening = false;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function measure(e: Entry) {
  const r = e.el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  return clamp01((vh - r.top) / (vh + r.height));
}

function tick(now: number) {
  const dt = Math.min(0.064, last ? (now - last) / 1000 : 0.016);
  last = now;
  let active = false;
  // read
  for (const e of entries) e.target = measure(e);
  // write
  for (const e of entries) {
    if (!e.started) {
      // first frame: no lerp, land where the page already is
      e.started = true;
      e.p = e.target;
      e.cb(e.p);
      continue;
    }
    const d = e.target - e.p;
    if (Math.abs(d) < 0.0004) {
      if (e.p !== e.target) {
        e.p = e.target;
        e.cb(e.p);
      }
      continue;
    }
    e.p += d * (1 - Math.exp(-e.k * dt));
    e.cb(e.p);
    active = true;
  }
  raf = active ? requestAnimationFrame(tick) : 0;
  if (!active) last = 0;
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

/**
 * Follow an element through the viewport. `cb` receives the eased progress
 * (0..1). Returns an unsubscribe function.
 */
export function trackView(
  el: HTMLElement,
  cb: (p: number) => void,
  { stiffness = 9 }: { stiffness?: number } = {}
) {
  const e: Entry = { el, cb, k: stiffness, p: 0, target: 0, started: false };
  entries.add(e);
  listen();
  schedule();
  return () => {
    entries.delete(e);
  };
}

/** Re-run a frame (after a layout change that moved things). */
export function nudge() {
  schedule();
}
