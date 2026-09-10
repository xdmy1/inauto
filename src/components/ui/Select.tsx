"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckIcon } from "../icons";

export type SelectOption = { value: string; label: string };

/**
 * Custom dropdown used site-wide instead of native <select>.
 * Renders a hidden input when `name` is set, so it works inside GET forms.
 */
export function Select({
  options,
  value,
  onChange,
  name,
  placeholder = "—",
  searchable = false,
  variant = "light",
  className,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  searchable?: boolean;
  variant?: "light" | "dark";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const closeTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const all = useMemo(
    () => [{ value: "", label: placeholder }, ...options],
    [options, placeholder]
  );
  const filtered = useMemo(() => {
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(
      (o) => o.value === "" || o.label.toLowerCase().includes(q)
    );
  }, [all, query]);

  const selected = all.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (highlight < 0 || !listRef.current) return;
    listRef.current
      .querySelectorAll("[role=option]")
      [highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  // animate out, then unmount (matching close for the entrance animation)
  function close() {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setQuery("");
      setHighlight(-1);
    }, 200);
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function pick(v: string) {
    onChange(v);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setHighlight(filtered.findIndex((o) => o.value === value));
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && filtered[highlight]) pick(filtered[highlight].value);
    } else if (e.key === "Tab") {
      close();
    }
  }

  const trigger =
    variant === "dark"
      ? "h-11 w-full rounded-lg border border-white/15 bg-white/[0.07] px-3 text-sm text-white transition-colors hover:border-white/30 data-[open=true]:border-white/50"
      : "h-11 w-full rounded-xl border border-line bg-card px-3.5 text-sm text-ink transition-colors hover:border-ink-faint data-[open=true]:border-ink data-[open=true]:ring-2 data-[open=true]:ring-ink/10";

  const valueCls =
    value === ""
      ? variant === "dark"
        ? "text-white/40"
        : "text-ink-faint"
      : "";

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        data-open={open}
        onClick={() => (open ? close() : (setClosing(false), setOpen(true)))}
        onKeyDown={onKeyDown}
        className={`flex cursor-pointer items-center justify-between gap-2 outline-none ${trigger}`}
      >
        <span className={`truncate ${valueCls}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          } ${variant === "dark" ? "text-white/55" : "text-ink-soft"}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* mobile bottom-sheet backdrop */}
          <div
            className={`select-backdrop fixed inset-0 z-50 bg-ink/45 sm:hidden ${closing ? "closing" : ""}`}
            onClick={close}
            aria-hidden="true"
          />
          <div
            id={listboxId}
            className={`select-panel overflow-hidden border border-line bg-card shadow-lift ${closing ? "closing" : ""}`}
          >
            {/* drag handle (mobile only) */}
            <div className="pt-2.5 sm:hidden">
              <div className="mx-auto h-1 w-10 rounded-full bg-line" />
            </div>
            {searchable && (
              <div className="border-b border-line p-2.5 sm:p-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlight(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Caută..."
                  className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-ink sm:h-9 sm:text-sm"
                />
              </div>
            )}
            <div
              ref={listRef}
              role="listbox"
              className="flex-1 overflow-y-auto p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:max-h-64 sm:p-1.5 sm:pb-1.5"
            >
              {filtered.map((o, i) => {
                const isSelected = o.value === value;
                return (
                  <div
                    key={o.value || "__any"}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(o.value);
                    }}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3.5 py-3 text-base sm:px-3 sm:py-2 sm:text-sm ${
                      i === highlight ? "bg-paper" : ""
                    } ${isSelected ? "font-semibold text-accent" : "text-ink"} ${
                      o.value === "" ? "text-ink-soft" : ""
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-ink-faint">—</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
