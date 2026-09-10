"use client";

// Mobile navigation — right-side drawer with nav, categories and contact CTAs
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { site, telHref, waHref } from "@/lib/site";
import { Logo } from "./Logo";
import { ArrowRightIcon, PhoneIcon } from "./icons";

export function MobileMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  function close() {
    if (!open || closing) return;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setClosing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/auto", label: t("nav.catalog") },
    { href: "/despre", label: t("nav.about") },
    { href: "/contacte", label: t("nav.contact") },
  ];

  const categories = [
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?body=sedan", label: t("options.body.sedan") },
    { href: "/auto?fuel=diesel", label: t("options.fuel.diesel") },
    { href: "/auto?fuel=hybrid", label: t("options.fuel.hybrid") },
    { href: "/auto?priceMax=10000", label: t("footer.under10k") },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Meniu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="chip-3d flex h-10 w-10 items-center justify-center rounded-xl"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
          <path
            d="M2 4.5h12M2 8h12M2 11.5h12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open &&
        createPortal(
        <div className="fixed inset-0 z-50">
          <div
            className={`select-backdrop absolute inset-0 bg-ink/60 ${closing ? "closing" : ""}`}
            onClick={close}
            aria-hidden
          />
          <aside
            className={`drawer-panel absolute right-0 top-0 flex h-dvh w-[86%] max-w-[360px] flex-col bg-card shadow-lift ${
              closing ? "closing" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link href="/" onClick={close} aria-label={site.name}>
                <Logo markClassName="h-10 w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Închide"
                onClick={close}
                className="chip-3d flex h-10 w-10 items-center justify-center rounded-xl"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <nav aria-label="Mobile">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={`flex items-center justify-between border-b border-line py-3.5 font-display text-lg font-bold ${
                        active ? "text-accent" : "text-ink"
                      }`}
                    >
                      {item.label}
                      <ArrowRightIcon
                        className={`h-4 w-4 ${active ? "text-accent" : "text-ink-faint"}`}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {t("footer.categories")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={close}
                      className="chip-3d rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink-soft"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-line px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <a href={telHref(site.phones[0])} className="btn-primary w-full">
                <PhoneIcon className="h-4 w-4" />
                {t("common.call")} · {site.phoneDisplay[0]}
              </a>
              <a
                href={waHref(site.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-medium text-ink-soft underline-offset-4 hover:underline"
              >
                {t("common.waQuiet")}
              </a>
              <p className="mt-3 text-center text-xs text-ink-faint">
                {site.address.full}
              </p>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </div>
  );
}
