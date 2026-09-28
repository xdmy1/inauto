"use client";

// Main nav (desktop): plain links with a red indicator under the current
// page, and a mega panel under "Automobile" — body types, popular filters
// and the three cars that came in last. "Microbuze" (minivan + van) is its
// own category.
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { MINIBUS } from "@/lib/cars";
import { site, telHref } from "@/lib/site";
import { OpenNowBadge } from "./OpenNowBadge";
import { ArrowIcon, ChevronIcon } from "./HeaderIcons";

export type NavCar = {
  slug: string;
  title: string;
  year: number;
  price: string;
  img: string | null;
};

const CLOSE_MS = 150;
const LEAVE_MS = 160;

export function NavMenu({ latest }: { latest: NavCar[] }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
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
  const rootRef = useRef<HTMLDivElement>(null);
  // mirror of the state for the timers (they outlive the render they started in)
  const state = useRef({ open, closing });
  useEffect(() => {
    state.current = { open, closing };
  }, [open, closing]);
  const closeTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);

  function show() {
    window.clearTimeout(leaveTimer.current);
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpen(true);
  }
  function close() {
    window.clearTimeout(leaveTimer.current);
    if (!state.current.open || state.current.closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_MS);
  }
  const hoverable = () => window.matchMedia("(hover: hover)").matches;

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(leaveTimer.current);
    },
    []
  );

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
  }, [open]);

  const bodies = [
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?body=sedan", label: t("options.body.sedan") },
    { href: "/auto?body=hatchback", label: t("options.body.hatchback") },
    { href: "/auto?body=wagon", label: t("options.body.wagon") },
    { href: `/auto?body=${MINIBUS}`, label: t("options.body.minibus") },
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

  const isMinibus =
    pathname.startsWith("/auto") && searchParams.get("body") === MINIBUS;
  const isCatalog = pathname.startsWith("/auto") && !isMinibus;
  const active = (on: boolean) => (on ? "" : undefined);

  return (
    <nav className="site-nav" aria-label="Main">
      <Link href="/" className="nav-link" data-active={active(pathname === "/")}>
        {t("nav.home")}
      </Link>

      <div
        ref={rootRef}
        className="relative"
        onMouseEnter={() => hoverable() && show()}
        onMouseLeave={() => {
          if (!hoverable()) return;
          leaveTimer.current = window.setTimeout(close, LEAVE_MS);
        }}
      >
        <button
          type="button"
          aria-expanded={open && !closing}
          aria-haspopup="true"
          onClick={() => {
            // with a mouse the panel already opened on hover, so a click is
            // the destination itself; on touch, a tap opens and closes it
            if (hoverable()) {
              close();
              router.push("/auto");
              return;
            }
            if (open && !closing) close();
            else show();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === " ") {
              e.preventDefault();
              show();
            }
          }}
          className="nav-link"
          data-active={active(isCatalog)}
        >
          {t("nav.catalog")}
          <ChevronIcon className="nav-chevron" />
        </button>

        {open && (
          <div className={`mega dropdown-pop ${closing ? "closing" : ""}`}>
            <div className="mega-grid">
              <div>
                <div className="mega-head">{t("common.body")}</div>
                {bodies.map((l) => (
                  <Link key={l.href} href={l.href} onClick={close} className="mega-link">
                    {l.label}
                  </Link>
                ))}
              </div>
              <div>
                <div className="mega-head">{t("footer.categories")}</div>
                {quick.map((l) => (
                  <Link key={l.href} href={l.href} onClick={close} className="mega-link">
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="mega-latest">
                <div className="mega-head">{t("home.latestTitle")}</div>
                {latest.map((c) => (
                  <Link key={c.slug} href={`/auto/${c.slug}`} onClick={close} className="mega-car">
                    <span className="mega-car-img">
                      {c.img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.img} alt="" width={68} height={50} loading="lazy" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="mega-car-title block">{c.title}</span>
                      <span className="mega-car-meta block">{c.year}</span>
                    </span>
                    <span className="mega-car-price">{c.price}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mega-foot">
              <Link href="/auto" onClick={close} className="mega-foot-all">
                {t("home.allCars")}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
              <div className="mega-foot-right">
                <OpenNowBadge className="whitespace-nowrap" />
                <a href={telHref(site.phones[0])}>{site.phoneDisplay[0]}</a>
              </div>
            </div>
          </div>
        )}
      </div>

      <Link href={`/auto?body=${MINIBUS}`} className="nav-link" data-active={active(isMinibus)}>
        {t("nav.minibus")}
      </Link>
      <Link href="/despre" className="nav-link" data-active={active(pathname === "/despre")}>
        {t("nav.about")}
      </Link>
      <Link href="/contacte" className="nav-link" data-active={active(pathname === "/contacte")}>
        {t("nav.contact")}
      </Link>
    </nav>
  );
}
