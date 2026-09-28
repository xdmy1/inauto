// Frame sets for the orbit (written by the extraction script; the frames
// live in public/orbit). Desktop: every source frame (24 fps × 8 s), the
// full 16:9 frame. Phones: two of every three, a tighter portrait crop
// around the car. Neighbouring frames are crossfaded on the canvas, so a
// slow scroll never steps.
import type { OrbitFrames } from "./OrbitStage";

export const ORBIT_DESKTOP: OrbitFrames = {
  dir: "/orbit/d",
  count: 192,
  width: 1280,
  height: 720,
  poster: "/orbit/poster.webp",
};

export const ORBIT_MOBILE: OrbitFrames = {
  dir: "/orbit/m",
  count: 128,
  width: 640,
  height: 758,
  poster: "/orbit/poster-m.webp",
};

/** degrees the camera travels over the clip (the dial and the read-out) */
export const ORBIT_SWEEP = 90;
