// Frame sets for the orbit (written by the extraction script; the frames
// live in public/orbit). Desktop: the full 16:9 frame. Phones: a tighter
// portrait crop around the car so it fills the top of the screen.
import type { OrbitFrames } from "./OrbitStage";

export const ORBIT_DESKTOP: OrbitFrames = {
  dir: "/orbit/d",
  count: 96,
  width: 1280,
  height: 720,
  poster: "/orbit/poster.webp",
};

export const ORBIT_MOBILE: OrbitFrames = {
  dir: "/orbit/m",
  count: 64,
  width: 640,
  height: 800,
  poster: "/orbit/poster-m.webp",
};

/** degrees the camera travels over the clip (for the corner dial) */
export const ORBIT_SWEEP = 90;
