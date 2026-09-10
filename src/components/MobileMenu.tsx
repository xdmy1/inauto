"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

type Item = { href: string; label: string };

export function MobileMenu({
  items,
  phone,
  phoneHref,
}: {
  items: Item[];
  phone: string;
  phoneHref: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Meniu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
          {open ? (
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M2 4.5h12M2 8h12M2 11.5h12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-line bg-paper shadow-card">
          <nav className="mx-auto flex max-w-[1360px] flex-col px-4 py-3 sm:px-6">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`border-b border-line py-3 text-base font-medium last:border-0 ${
                  pathname === item.href ? "text-accent" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={phoneHref}
              className="py-3 text-base font-semibold tabular-nums"
            >
              {phone}
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
