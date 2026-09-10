import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, telHref, waHref } from "@/lib/site";
import { Logo } from "./Logo";
import {
  ClockIcon,
  FacebookIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "./icons";

export async function Footer() {
  const t = await getTranslations();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/auto", label: t("nav.catalog") },
    { href: "/despre", label: t("nav.about") },
    { href: "/contacte", label: t("nav.contact") },
  ];

  const categoryLinks = [
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?body=sedan", label: t("options.body.sedan") },
    { href: "/auto?fuel=diesel", label: t("options.fuel.diesel") },
    { href: "/auto?fuel=hybrid", label: t("options.fuel.hybrid") },
    { href: "/auto?transmission=automatic", label: t("options.transmission.automatic") },
    { href: "/auto?priceMax=10000", label: t("footer.under10k") },
  ];

  const hours = [
    { d: t("contact.hoursMoFr"), h: "09:00 – 18:00" },
    { d: t("contact.hoursSa"), h: "09:00 – 15:00" },
    { d: t("contact.hoursSu"), h: "09:00 – 13:00" },
  ];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.address.street}, ${site.address.city}`
  )}`;

  const colTitle =
    "text-xs font-semibold uppercase tracking-[0.16em] text-white/40";
  const link =
    "text-[15px] font-light text-white/75 transition-colors hover:text-white";

  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        {/* main grid */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_1.1fr]">
          {/* brand */}
          <div>
            <Link href="/" aria-label={site.name}>
              <Logo variant="dark" markClassName="h-14 w-auto" />
            </Link>
            <p className="mt-5 max-w-xs text-[15px] font-light leading-relaxed text-white/60">
              {t("footer.about")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={site.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                <FacebookIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href={waHref(site.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                <WhatsAppIcon className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* navigation */}
          <nav aria-label={t("footer.navigation")}>
            <h3 className={colTitle}>{t("footer.navigation")}</h3>
            <ul className="mt-5 space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* popular categories */}
          <nav aria-label={t("footer.categories")}>
            <h3 className={colTitle}>{t("footer.categories")}</h3>
            <ul className="mt-5 space-y-3">
              {categoryLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* contact */}
          <div>
            <h3 className={colTitle}>{t("footer.contact")}</h3>
            <ul className="mt-5 space-y-3.5">
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
          </div>

          {/* hours */}
          <div>
            <h3 className={colTitle}>{t("footer.hours")}</h3>
            <ul className="mt-5 space-y-3">
              {hours.map((r) => (
                <li key={r.d} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3 text-[15px] font-light text-white/60">
                    <ClockIcon className="h-4 w-4 shrink-0 text-accent" />
                    {r.d}
                  </span>
                  <span className="text-[15px] font-light tabular-nums text-white/85">
                    {r.h}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={telHref(site.phones[0])}
              className="btn-primary mt-6 h-11 w-full text-[13px]"
            >
              <PhoneIcon className="h-4 w-4" />
              {t("common.call")}
            </a>
          </div>
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-[13px] font-light text-white/40 sm:flex-row">
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
