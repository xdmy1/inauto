"use client";

import { useEffect, useRef, useState } from "react";

type Sources = { mp4: string; webm?: string; poster: string };

// A muted, looping background video for a section that already shows the
// same frame as a still image underneath. The still is what the server
// renders and what everyone under prefers-reduced-motion or data saver keeps;
// the video only mounts on the client when motion is fine, fades in once it
// is actually playing, and pauses while its section is off screen or the tab
// is hidden, so idle cost is zero. Phones can get a lighter encode.
export function LoopVideo({
  desktop,
  mobile,
  className = "",
}: {
  desktop: Sources;
  /** a lighter, tighter encode for narrow screens (below 768px) */
  mobile?: Sources;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [sources, setSources] = useState<Sources | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const pick = () => {
      if (reduced.matches || saveData) {
        setSources(null);
        return;
      }
      setSources(narrow.matches && mobile ? mobile : desktop);
    };
    pick();
    reduced.addEventListener("change", pick);
    narrow.addEventListener("change", pick);
    return () => {
      reduced.removeEventListener("change", pick);
      narrow.removeEventListener("change", pick);
    };
  }, [desktop, mobile]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !sources) return;
    let inView = true;
    const sync = () => {
      if (inView && document.visibilityState === "visible") {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.02 }
    );
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [sources]);

  if (!sources) return null;

  return (
    <video
      key={sources.mp4}
      ref={ref}
      className={`loop-video ${live ? "is-live" : ""} ${className}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={sources.poster}
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setLive(true)}
    >
      {sources.webm && <source src={sources.webm} type="video/webm" />}
      <source src={sources.mp4} type="video/mp4" />
    </video>
  );
}
