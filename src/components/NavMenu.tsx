"use client";

// Main nav: active-page indicator + "Automobile" category dropdown
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowRightIcon } from "./icons";

export function NavMenu() {
  const t = useTranslations();
  const pathname = usePathname();
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
  // close the panel whenever navigation happens
  useEffect(() => {
    setOpen(false);
    setClosing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  const bodies = [
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?body=sedan", label: t("options.body.sedan") },
    { href: "/auto?body=hatchback", label: t("options.body.hatchback") },
    { href: "/auto?body=wagon", label: t("options.body.wagon") },
    { href: "/auto?body=minivan", label: t("options.body.minivan") },
  ];
  const quick = [
    { href: "/auto?fuel=diesel", label: t("options.fuel.diesel") },
    { href: "/auto?fuel=hybrid", label: t("options.fuel.hybrid") },
    { href: "/auto?fuel=petrol", label: t("options.fuel.petrol") },
    {
      href: "/auto?transmission=automatic",
      label: t("options.transmission.automatic"),
    },
    { href: "/auto?priceMax=10000", label: t("footer.under10k") },
  ];

  const itemCls = (active: boolean) =>
    `relative flex h-[72px] items-center text-sm font-semibold transition-colors ${
      active ? "text-ink" : "text-ink-soft hover:text-ink"
    }`;

  const underline = (
    <span
      className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-accent"
      aria-hidden
    />
  );

  const isCatalog = pathname.startsWith("/auto");

  return (
    <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
      <Link href="/" className={itemCls(pathname === "/")}>
        {t("nav.home")}
        {pathname === "/" && underline}
      </Link>

      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
          className={`${itemCls(isCatalog)} gap-1.5`}
        >
          {t("nav.catalog")}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3 w-3 text-ink-faint transition-transform duration-200 ${
              open && !closing ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          {isCatalog && underline}
        </button>

        {open && (
          <div
            className={`dropdown-pop absolute left-1/2 top-full z-50 w-[440px] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-card shadow-lift ${
              closing ? "closing" : ""
            }`}
          >
            <div className="grid grid-cols-2 gap-x-2 p-4">
              <div>
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {t("common.body")}
                </div>
                {bodies.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div>
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {t("footer.categories")}
                </div>
                {quick.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/auto"
              onClick={close}
              className="flex items-center justify-between border-t border-line bg-paper/60 px-6 py-3.5 text-sm font-bold text-accent transition-colors hover:text-accent-deep"
            >
              {t("home.allCars")}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      <Link href="/despre" className={itemCls(pathname === "/despre")}>
        {t("nav.about")}
        {pathname === "/despre" && underline}
      </Link>
      <Link href="/contacte" className={itemCls(pathname === "/contacte")}>
        {t("nav.contact")}
        {pathname === "/contacte" && underline}
      </Link>
    </nav>
  );
}
