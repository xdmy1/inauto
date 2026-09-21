"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { imageUrl } from "@/lib/images";
import { CarMark } from "./Logo";

const chevron = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Main photo + thumbnail strip; arrows, keyboard ← →, swipe on phones.
// A click on the main photo opens the fullscreen viewer.
export function Gallery({
  images,
  alt,
}: {
  images: { path: string }[];
  alt: string;
}) {
  const t = useTranslations("car");
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const trigger = useRef<HTMLButtonElement>(null);
  const n = images.length;

  const go = useCallback(
    (d: number) => setIndex((i) => (n ? (i + d + n) % n : 0)),
    [n]
  );

  const close = useCallback(() => {
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      trigger.current?.focus();
    }, 180);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
      if (n < 2) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, go, open, close]);

  // lock body scroll while the viewer is open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (n === 0) {
    return (
      <div className="card flex aspect-[4/3] items-center justify-center rounded-2xl text-line">
        <CarMark className="h-16 w-auto" />
      </div>
    );
  }
  const current = images[Math.min(index, n - 1)];

  const arrow =
    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink shadow-lift backdrop-blur transition-all hover:bg-card active:scale-95";

  return (
    <div>
      <div
        className="card relative overflow-hidden rounded-2xl bg-line/40"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX == null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          setTouchX(null);
        }}
      >
        <button
          ref={trigger}
          type="button"
          aria-label={t("galleryOpen")}
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.path}
            src={imageUrl(current.path, "lg")}
            alt={`${alt} — ${index + 1}`}
            width={1600}
            height={1200}
            fetchPriority="high"
            className="aspect-[4/3] w-full object-cover"
          />
        </button>
        <span className="photo-badge photo-badge-ink pointer-events-none absolute bottom-3 left-3 h-7 px-2">
          <svg {...chevron} className="h-3.5 w-3.5">
            <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
          </svg>
        </span>
        {n > 1 && (
          <>
            <button type="button" aria-label={t("galleryPrev")} onClick={() => go(-1)} className={`${arrow} left-3`}>
              <svg {...chevron} className="h-5 w-5">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <button type="button" aria-label={t("galleryNext")} onClick={() => go(1)} className={`${arrow} right-3`}>
              <svg {...chevron} className="h-5 w-5">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            <span className="photo-badge photo-badge-ink absolute bottom-3 right-3 h-7 px-2.5 text-xs normal-case tracking-normal">
              {index + 1} / {n}
            </span>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="scroll-row mt-3">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("galleryPhoto", { n: i + 1 })}
              aria-current={i === index}
              className={`w-[104px] shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:w-[120px] ${
                i === index
                  ? "border-accent"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(img.path, "sm")}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {open &&
        createPortal(
          <Viewer
            images={images}
            index={Math.min(index, n - 1)}
            alt={alt}
            closing={closing}
            go={go}
            select={setIndex}
            close={close}
          />,
          document.body
        )}
    </div>
  );
}

// Fullscreen viewer: the photo as large as the screen allows, tap / click to
// zoom in, pinch or wheel to zoom freely, drag to pan, swipe for the next
// photo, swipe down or Esc to close.
function Viewer({
  images,
  index,
  alt,
  closing,
  go,
  select,
  close,
}: {
  images: { path: string }[];
  index: number;
  alt: string;
  closing: boolean;
  go: (d: number) => void;
  select: (i: number) => void;
  close: () => void;
}) {
  const t = useTranslations("car");
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const n = images.length;

  useEffect(() => closeBtn.current?.focus(), []);

  // neighbours load ahead, so the next photo is there when asked for
  useEffect(() => {
    for (const d of [1, -1]) {
      const img = new Image();
      img.src = imageUrl(images[(index + d + n) % n].path, "lg");
    }
  }, [images, index, n]);

  useEffect(() => {
    strip.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [index]);

  // keep Tab inside the viewer
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const items = dialog.current?.querySelectorAll<HTMLElement>("button");
    if (!items?.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const round =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20 active:scale-95";

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[70]"
    >
      <div
        className={`select-backdrop absolute inset-0 bg-[#080a12]/95 ${closing ? "closing" : ""}`}
        aria-hidden
      />
      <div className={`viewer-stage absolute inset-0 flex flex-col ${closing ? "closing" : ""}`}>
        <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <span className="text-sm font-semibold tabular-nums text-white/80">
            {index + 1} / {n}
          </span>
          <button
            ref={closeBtn}
            type="button"
            aria-label={t("galleryClose")}
            onClick={close}
            className={round}
          >
            <svg {...chevron} className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <ZoomPhoto
            key={images[index].path}
            src={imageUrl(images[index].path, "lg")}
            alt={`${alt} — ${index + 1}`}
            onSwipe={n > 1 ? go : undefined}
            onDismiss={close}
          />
          {n > 1 && (
            <>
              <button
                type="button"
                aria-label={t("galleryPrev")}
                onClick={() => go(-1)}
                className={`${round} absolute left-3 top-1/2 -translate-y-1/2 max-sm:hidden sm:left-6`}
              >
                <svg {...chevron} className="h-5 w-5">
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={t("galleryNext")}
                onClick={() => go(1)}
                className={`${round} absolute right-3 top-1/2 -translate-y-1/2 max-sm:hidden sm:right-6`}
              >
                <svg {...chevron} className="h-5 w-5">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {n > 1 && (
          <div
            ref={strip}
            className="scroll-row mx-auto max-w-full px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6"
          >
            {images.map((img, i) => (
              <button
                key={img.path}
                type="button"
                onClick={() => select(i)}
                aria-label={t("galleryPhoto", { n: i + 1 })}
                aria-current={i === index}
                className={`w-[68px] shrink-0 overflow-hidden rounded-md border-2 transition-all sm:w-[88px] ${
                  i === index
                    ? "border-white"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(img.path, "sm")}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;

function ZoomPhoto({
  src,
  alt,
  onSwipe,
  onDismiss,
}: {
  src: string;
  alt: string;
  onSwipe?: (d: number) => void;
  onDismiss: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [zoomed, setZoomed] = useState(false);
  // transform lives in a ref and goes straight to the style — no re-render per move
  const v = useRef({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ x: 0, y: 0, t: 0, moved: false, dist: 0 });

  // size of the photo as drawn (object-contain) at zoom 1
  function drawn() {
    const b = box.current!.getBoundingClientRect();
    const el = img.current!;
    const k = Math.min(b.width / (el.naturalWidth || 4), b.height / (el.naturalHeight || 3));
    return { b, w: (el.naturalWidth || 4) * k, h: (el.naturalHeight || 3) * k };
  }

  function apply(animate: boolean) {
    const { b, w, h } = drawn();
    const t = v.current;
    const mx = Math.max(0, (w * t.s - b.width) / 2);
    const my = Math.max(0, (h * t.s - b.height) / 2);
    t.x = Math.min(mx, Math.max(-mx, t.x));
    t.y = Math.min(my, Math.max(-my, t.y));
    const el = img.current!;
    el.style.transition = animate ? "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)" : "none";
    el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`;
    setZoomed(t.s > 1.01);
  }

  // zoom to `s`, keeping the point under (cx, cy) where it is
  function zoomAt(s: number, cx: number, cy: number, animate: boolean) {
    const { b } = drawn();
    const t = v.current;
    const next = Math.min(MAX_ZOOM, Math.max(1, s));
    const fx = cx - (b.left + b.width / 2);
    const fy = cy - (b.top + b.height / 2);
    t.x = fx - (fx - t.x) * (next / t.s);
    t.y = fy - (fy - t.y) * (next / t.s);
    t.s = next;
    apply(animate);
  }

  function pinchDistance() {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size === 1) {
      gesture.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false, dist: 0 };
    } else {
      g.moved = true;
      g.dist = pinchDistance();
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (pointers.current.size >= 2) {
      const dist = pinchDistance();
      const [a, b] = [...pointers.current.values()];
      if (g.dist) zoomAt(v.current.s * (dist / g.dist), (a.x + b.x) / 2, (a.y + b.y) / 2, false);
      g.dist = dist;
      return;
    }
    if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) g.moved = true;
    if (v.current.s > 1) {
      v.current.x += e.clientX - prev.x;
      v.current.y += e.clientY - prev.y;
      apply(false);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!pointers.current.delete(e.pointerId)) return;
    if (pointers.current.size > 0) return;
    const g = gesture.current;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (!g.moved && e.timeStamp - g.t < 350) {
      const { b, w, h } = drawn();
      const inside =
        Math.abs(e.clientX - (b.left + b.width / 2)) <= (w * v.current.s) / 2 &&
        Math.abs(e.clientY - (b.top + b.height / 2)) <= (h * v.current.s) / 2;
      if (!inside) onDismiss();
      else if (v.current.s > 1) zoomAt(1, e.clientX, e.clientY, true);
      else zoomAt(TAP_ZOOM, e.clientX, e.clientY, true);
      return;
    }
    if (v.current.s > 1.01 || g.dist) {
      if (v.current.s <= 1.01) zoomAt(1, e.clientX, e.clientY, true);
      return;
    }
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) onSwipe?.(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx)) onDismiss();
  }

  return (
    <div
      ref={box}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={(e) => zoomAt(v.current.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY, false)}
      className={`absolute inset-0 touch-none select-none overflow-hidden ${
        zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain will-change-transform"
      />
    </div>
  );
}
