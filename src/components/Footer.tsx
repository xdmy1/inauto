import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MINIBUS } from "@/lib/cars";
import { site, telHref, waHref } from "@/lib/site";
import { brandSlug, getBrandsWithCounts } from "@/lib/cars";
import { Logo } from "./Logo";
import { HoursList } from "./HoursList";
import { OpenNowBadge } from "./OpenNowBadge";
import {
  ArrowRightIcon,
  ExternalIcon,
  FacebookIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "./icons";

export async function Footer() {
  const t = await getTranslations();
  // the brands with the most cars in stock — the links people actually need
  const brands = [...(await getBrandsWithCounts().catch(() => []))]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/auto", label: t("nav.catalog") },
    { href: "/despre", label: t("nav.about") },
    { href: "/contacte", label: t("nav.contact") },
  ];

  const categoryLinks = [
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?body=sedan", label: t("options.body.sedan") },
    { href: `/auto?body=${MINIBUS}`, label: t("options.body.minibus") },
    { href: "/auto?fuel=diesel", label: t("options.fuel.diesel") },
    { href: "/auto?fuel=hybrid", label: t("options.fuel.hybrid") },
    { href: "/auto?transmission=automatic", label: t("options.transmission.automatic") },
    { href: "/auto?priceMax=10000", label: t("footer.under10k") },
  ];

  const hours = [
    { label: t("contact.hoursMoFr"), hours: "09:00 – 19:00", days: [1, 2, 3, 4, 5] },
    { label: t("contact.hoursSa"), hours: "09:00 – 16:00", days: [6] },
    { label: t("contact.hoursSu"), hours: "10:00 – 14:00", days: [0] },
  ];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.address.street}, ${site.address.city}`
  )}`;

  const colTitle =
    "text-xs font-semibold uppercase tracking-[0.16em] text-white/60";
  // side-by-side columns on phones: a title that wraps must not push its list down
  const colTitleRow = "max-lg:flex max-lg:h-8 max-lg:items-end";
  const link =
    "text-[15px] font-normal text-white/75 transition-colors hover:text-white";
  const social =
    "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white";

  return (
    <footer className="mt-44 bg-ink text-white sm:mt-48">
      <div className="mx-auto flow-root max-w-[1360px] px-4 sm:px-6">
        {/* visit band — sits across the footer's top edge, with the real wall sign */}
        <div className="footer-band relative -mt-24 overflow-hidden rounded-3xl">
          <div className="footer-band-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/parcare.webp"
              alt={`${site.name} — ${site.address.full}`}
              width={1280}
              height={620}
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="relative -mt-8 px-5 pb-6 sm:px-9 sm:pb-9 lg:mt-0 lg:max-w-[54%] lg:p-10">
            <OpenNowBadge />
            <h2 className="mt-1.5 font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
              {t("home.contactTitle")}
            </h2>
            <p className="mt-2 text-[15px] font-normal leading-relaxed text-white/65">
              {t("home.contactText")}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
              <a href={telHref(site.phones[0])} className="btn-primary px-4 tabular-nums sm:px-6">
                <PhoneIcon className="h-4 w-4" />
                {site.phoneDisplay[0]}
              </a>
              <a
                href={waHref(site.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-display text-sm font-bold text-white sm:px-6"
              >
                <WhatsAppIcon className="h-4.5 w-4.5" />
                WhatsApp
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-3 font-display text-sm font-bold text-white/80 transition-colors hover:text-white"
              >
                <MapPinIcon className="h-4 w-4 text-accent" />
                {t("home.mapCta")}
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* main grid — two columns on phones, five from lg */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-11 py-14 lg:grid-cols-[1.3fr_0.7fr_0.85fr_0.95fr_1.5fr] lg:gap-x-10">
          {/* brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" aria-label={site.name}>
              <Logo variant="dark" markClassName="h-14 w-auto" />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] font-normal leading-relaxed text-white/60 lg:max-w-xs">
              {t("footer.about")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={site.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={social}
              >
                <FacebookIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href={waHref(site.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className={social}
              >
                <WhatsAppIcon className="h-4.5 w-4.5" />
              </a>
            </div>
            <a
              href={site.social.nnn}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-5 inline-flex items-center gap-2 ${link}`}
            >
              {t("footer.nnn")}
              <ExternalIcon className="h-3.5 w-3.5 text-white/60" />
            </a>
          </div>

          {/* navigation */}
          <nav aria-label={t("footer.navigation")} className="max-lg:order-1">
            <h3 className={`${colTitle} ${colTitleRow}`}>{t("footer.navigation")}</h3>
            <ul className="mt-5 space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`footer-link ${link}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* brands → SEO brand pages */}
          {brands.length > 0 && (
            <nav aria-label={t("footer.brands")} className="max-lg:order-3 max-lg:col-span-2">
              <h3 className={colTitle}>{t("footer.brands")}</h3>
              <ul className="mt-5 columns-2 gap-x-6 lg:columns-1">
                {brands.map((b) => (
                  <li key={b.brand} className="mb-3 break-inside-avoid">
                    <Link href={`/marca/${brandSlug(b.brand)}`} className={`footer-link ${link}`}>
                      {b.brand}
                      <span className="ml-1.5 text-white/60 tabular-nums">{b.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* popular categories */}
          <nav aria-label={t("footer.categories")} className="max-lg:order-2">
            <h3 className={`${colTitle} ${colTitleRow}`}>{t("footer.categories")}</h3>
            <ul className="mt-5 space-y-3">
              {categoryLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`footer-link ${link}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* contact + hours, one card */}
          <div className="col-span-2 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-inset ring-white/[0.07] max-lg:order-4 sm:p-6 lg:col-span-1">
            <h3 className={colTitle}>{t("footer.contact")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-3 ${link}`}
                >
                  <MapPinIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {t("footer.address")}
                </a>
              </li>
              {site.phones.map((p, i) => (
                <li key={p}>
                  <a href={telHref(p)} className={`flex items-center gap-3 ${link} tabular-nums`}>
                    <PhoneIcon className="h-4.5 w-4.5 shrink-0 text-accent" />
                    {site.phoneDisplay[i]}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${site.email}`} className={`flex items-center gap-3 ${link}`}>
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center text-accent">@</span>
                  {site.email}
                </a>
              </li>
            </ul>
            <h3 className={`${colTitle} mt-6 border-t border-white/10 pt-5`}>
              {t("footer.hours")}
            </h3>
            <div className="mt-4">
              <HoursList rows={hours} todayLabel={t("footer.today")} />
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pb-24 pt-6 text-[13px] font-normal text-white/60 sm:flex-row lg:pb-6 lg:pr-20">
          <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
          <span>
            {t("footer.madeBy")}{" "}
            <a
              href="https://landings.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-white"
            >
              landings.md
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
