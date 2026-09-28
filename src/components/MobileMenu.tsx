"use client";

// Phone navigation — an ink drawer from the right: the pages, popular
// filters, RO/RU, and the call button at the bottom.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { MINIBUS } from "@/lib/cars";
import { site, telHref, waHref } from "@/lib/site";
import { Logo } from "./Logo";
import { OpenNowBadge } from "./OpenNowBadge";
import { ArrowIcon, CrossIcon, HandsetIcon, MenuIcon } from "./HeaderIcons";

export function MobileMenu() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // close the panel whenever navigation happens (state adjusted during render)
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
    setClosing(false);
  }
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

  // same page, other language
  function switchLocale(next: string) {
    if (next === locale) return;
    const qs = searchParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { locale: next });
    close();
  }

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing]);

  const isMinibus =
    pathname.startsWith("/auto") && searchParams.get("body") === MINIBUS;
  const nav = [
    { href: "/", label: t("nav.home"), active: pathname === "/" },
    {
      href: "/auto",
      label: t("nav.catalog"),
      active: pathname.startsWith("/auto") && !isMinibus,
    },
    {
      href: `/auto?body=${MINIBUS}`,
      label: t("nav.minibus"),
      active: isMinibus,
    },
    { href: "/despre", label: t("nav.about"), active: pathname === "/despre" },
    {
      href: "/contacte",
      label: t("nav.contact"),
      active: pathname === "/contacte",
    },
  ];

  const categories = [
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?body=sedan", label: t("options.body.sedan") },
    { href: "/auto?fuel=diesel", label: t("options.fuel.diesel") },
    { href: "/auto?fuel=hybrid", label: t("options.fuel.hybrid") },
    { href: "/auto?transmission=automatic", label: t("options.transmission.automatic") },
    { href: "/auto?priceMax=10000", label: t("footer.under10k") },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Meniu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="burger"
      >
        <MenuIcon />
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
              className={`drawer drawer-panel absolute right-0 top-0 flex h-dvh w-[88%] max-w-[380px] flex-col ${
                closing ? "closing" : ""
              }`}
              aria-label="Meniu"
            >
              <div className="drawer-top">
                <Link href="/" onClick={close} aria-label={site.name}>
                  <Logo variant="dark" markClassName="h-9 w-auto" />
                </Link>
                <button
                  type="button"
                  aria-label={t("common.close")}
                  onClick={close}
                  className="drawer-close"
                >
                  <CrossIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
                <nav className="drawer-nav" aria-label="Mobile">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      data-active={item.active ? "" : undefined}
                    >
                      {item.label}
                      <ArrowIcon />
                    </Link>
                  ))}
                </nav>

                <div className="mt-7">
                  <div className="drawer-head">{t("footer.categories")}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Link key={c.href} href={c.href} onClick={close} className="drawer-chip">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* language, RO / RU */}
                <div className="mt-7 flex items-center justify-between">
                  <span className="drawer-head">{t("common.language")}</span>
                  <div className="drawer-lang" role="group" aria-label={t("common.language")}>
                    {routing.locales.map((l) => (
                      <button
                        key={l}
                        type="button"
                        lang={l}
                        onClick={() => switchLocale(l)}
                        aria-pressed={l === locale}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="drawer-foot">
                <a href={telHref(site.phones[0])} className="btn-primary w-full tabular-nums">
                  <HandsetIcon className="h-4 w-4" />
                  {t("common.call")} · {site.phoneDisplay[0]}
                </a>
                <OpenNowBadge className="drawer-open-now" />
                <a
                  href={waHref(site.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center text-sm font-medium text-white/80 underline-offset-4 hover:underline"
                >
                  {t("common.waQuiet")}
                </a>
                <p className="mt-3 text-center text-xs text-white/45">{site.address.full}</p>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
