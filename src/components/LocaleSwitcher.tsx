"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { CheckIcon, GlobeIcon } from "./icons";

const LOCALES = [
  { code: "ro", label: "Română" },
  { code: "ru", label: "Русский" },
] as const;

function SwitcherInner() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  function close() {
    if (!open || closing) return;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing]);

  function switchTo(next: string) {
    const qs = searchParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { locale: next });
    close();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="chip-3d flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold"
      >
        <GlobeIcon className="h-4 w-4 text-ink-soft" />
        <span className="uppercase">{locale}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 text-ink-soft transition-transform ${open && !closing ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className={`dropdown-pop absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-lift ${closing ? "closing" : ""}`}
        >
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => switchTo(l.code)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-paper ${
                  active ? "font-semibold text-accent" : "text-ink"
                }`}
              >
                {l.label}
                {active && <CheckIcon className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={null}>
      <SwitcherInner />
    </Suspense>
  );
}
