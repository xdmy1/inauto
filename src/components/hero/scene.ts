// The night sky over the dark side of the hero — plain 2D canvas, no libraries.
//   - stars in three depths: the far ones tiny and still, the near ones larger,
//     with a soft glow, drifting a little and twinkling out of step;
//   - a handful of bright stars with a thin four-point sparkle;
//   - shooting stars every few seconds, one at a time, fading as they go.
// Everything dissolves before the photo, and dims a little behind the text.
// HeroFx owns the canvas, timing and pausing.

export type Rect = { x: number; y: number; w: number; h: number };

type Layer = { share: number; r: [number, number]; alpha: [number, number]; drift: number; px: number; py: number; glow: boolean };

// far → near
const LAYERS: Layer[] = [
  { share: 0.56, r: [0.5, 1.0], alpha: [0.25, 0.5], drift: 1.2, px: 2, py: 1.5, glow: false },
  { share: 0.31, r: [1.0, 1.7], alpha: [0.4, 0.75], drift: 2.6, px: 6, py: 4, glow: true },
  { share: 0.13, r: [1.8, 2.7], alpha: [0.6, 0.95], drift: 5, px: 12, py: 8, glow: true },
];
const TINTS = ["255,255,255", "255,255,255", "255,255,255", "255,244,226", "216,228,255"];

type Star = {
  layer: number;
  x: number;
  y: number;
  r: number;
  alpha: number;
  tint: string;
  twT: number; // twinkle period s (0 = steady)
  twP: number;
  bright: boolean; // gets the four-point sparkle
};

type Meteor = { x: number; y: number; vx: number; vy: number; len: number; life: number; age: number };

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// deterministic pseudo-random: a re-layout looks like the one before
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// one soft glow sprite per tint, blitted many times
function makeGlow(rgb: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.55)`);
  grad.addColorStop(0.6, `rgba(${rgb},0.12)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}

export function createScene() {
  const rand = mulberry(20260923);
  let W = 0; // canvas width (the dark side)
  let H = 0;
  let sectionW = 0;
  const stars: Star[] = [];
  let meteors: Meteor[] = [];
  let nextMeteorAt = 0;
  let copy: Rect | null = null;
  const glows = new Map(TINTS.map((t) => [t, makeGlow(t)]));

  const between = (a: number, b: number) => a + rand() * (b - a);
  const inCopy = (x: number, y: number) =>
    !!copy && x > copy.x - 12 && x < copy.x + copy.w + 12 && y > copy.y - 12 && y < copy.y + copy.h + 12;

  function spawn(layer: number, atRightEdge = false): Star {
    const L = LAYERS[layer];
    const bright = layer === 2 && rand() < 0.3;
    return {
      layer,
      x: atRightEdge ? W + 6 : rand() * W,
      y: rand() * H,
      r: between(L.r[0], L.r[1]) * (bright ? 1.25 : 1),
      alpha: between(L.alpha[0], L.alpha[1]),
      tint: TINTS[Math.floor(rand() * TINTS.length)],
      twT: rand() < 0.6 ? between(1.6, 5) : 0,
      twP: rand() * Math.PI * 2,
      bright,
    };
  }

  function resize(w: number, h: number, sw: number) {
    const sx = W ? w / W : 1;
    const sy = H ? h / H : 1;
    W = w;
    H = h;
    sectionW = sw;
    const n = Math.min(260, Math.max(120, Math.round((W * H) / 3200)));
    if (stars.length) {
      for (const s of stars) { s.x *= sx; s.y *= sy; }
      while (stars.length > n) stars.pop();
      while (stars.length < n) stars.push(spawn(stars.length % 3));
      return;
    }
    for (let l = 0; l < 3; l++) {
      const count = Math.round(n * LAYERS[l].share);
      for (let i = 0; i < count; i++) stars.push(spawn(l));
    }
  }

  function setCopyRect(r: Rect | null) {
    copy = r;
  }

  /** true while a shooting star is on screen (the loop then runs at 60 fps) */
  const busy = () => meteors.length > 0;

  function step(dt: number, now: number) {
    const s = dt / 1000;
    for (const st of stars) {
      st.x -= LAYERS[st.layer].drift * s;
      if (st.x < -6) Object.assign(st, spawn(st.layer, true));
    }
    // a shooting star every 3–7 s, never two at once
    if (!meteors.length && nextMeteorAt && now >= nextMeteorAt) {
      const speed = between(700, 1100);
      const angle = between(0.3, 0.55); // radians below horizontal, heading right-down
      const fromLeft = rand() < 0.7;
      meteors.push({
        x: fromLeft ? between(0.02, 0.35) * W : between(0.35, 0.6) * W,
        y: between(0.04, 0.4) * H,
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(angle) * speed,
        len: between(110, 190),
        life: between(0.55, 0.85),
        age: 0,
      });
      nextMeteorAt = now + between(3000, 7000);
    }
    if (!nextMeteorAt) nextMeteorAt = now + 1500;
    for (const m of meteors) {
      m.x += m.vx * s;
      m.y += m.vy * s;
      m.age += s;
    }
    meteors = meteors.filter((m) => m.age < m.life && m.y < H + 40);
  }

  // px/py: smoothed pointer offset −1..1 — the sky leans away from it, by depth
  function draw(ctx: CanvasRenderingContext2D, now: number, px: number, py: number) {
    const t = now / 1000;
    const fadeA = sectionW * 0.47;
    const fadeB = sectionW * 0.62;
    ctx.globalCompositeOperation = "source-over";
    for (const st of stars) {
      const L = LAYERS[st.layer];
      const x = st.x - px * L.px;
      const y = st.y - py * L.py;
      if (x < -4 || x > W + 4) continue;
      let a = st.alpha;
      if (st.twT) a *= 0.65 + 0.35 * Math.sin((2 * Math.PI * t) / st.twT + st.twP);
      a *= 1 - smoothstep(fadeA, fadeB, x);
      if (inCopy(x, y)) a *= 0.55;
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      if (L.glow) {
        const d = st.r * 5;
        ctx.drawImage(glows.get(st.tint)!, x - d / 2, y - d / 2, d, d);
        if (st.bright) {
          // a thin four-point sparkle, breathing with the twinkle
          const len = st.r * 5 * (0.8 + 0.2 * Math.sin((2 * Math.PI * t) / (st.twT || 4) + st.twP));
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = `rgb(${st.tint})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x - len, y);
          ctx.lineTo(x + len, y);
          ctx.moveTo(x, y - len);
          ctx.lineTo(x, y + len);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = `rgb(${st.tint})`;
        ctx.fillRect(x - st.r, y - st.r, st.r * 2, st.r * 2);
      }
    }

    for (const m of meteors) {
      const k = m.age / m.life;
      const fade = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      const n = Math.hypot(m.vx, m.vy) || 1;
      const tx = m.x - (m.vx / n) * m.len;
      const ty = m.y - (m.vy / n) * m.len;
      const edge = 1 - smoothstep(fadeA, fadeB, m.x);
      const a = fade * edge;
      if (a < 0.02) continue;
      const g = ctx.createLinearGradient(tx, ty, m.x, m.y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.7, `rgba(255,255,255,${0.35 * a})`);
      g.addColorStop(1, `rgba(255,255,255,${0.95 * a})`);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.globalAlpha = a;
      ctx.drawImage(glows.get("255,255,255")!, m.x - 9, m.y - 9, 18, 18);
    }
    ctx.globalAlpha = 1;
  }

  return { resize, setCopyRect, busy, step, draw };
}
