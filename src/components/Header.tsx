import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { fmtPrice } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { site, telHref } from "@/lib/site";
import { HeaderShell } from "./HeaderShell";
import { Logo } from "./Logo";
import { NavMenu } from "./NavMenu";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { OpenNowBadge } from "./OpenNowBadge";
import { MobileMenu } from "./MobileMenu";
import { HandsetIcon } from "./HeaderIcons";

// One bar: logo, the pages, RO/RU and the phone. Behaviour (transparent
// over the home hero, shrink and hide on scroll) lives in HeaderShell +
// src/app/header.css.
export async function Header() {
  const t = await getTranslations();

  // the newest cars: a slim ticker above the bar, the first three also in the "Automobile" panel
  const newest = await prisma.car.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      slug: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { path: true } },
    },
  });
  const latest = newest.slice(0, 3).map((c) => ({
    slug: c.slug,
    title: `${c.brand} ${c.model}`,
    year: c.year,
    price: fmtPrice(c.price),
    img: c.images[0] ? imageUrl(c.images[0].path, "sm") : null,
  }));

  const tel = telHref(site.phones[0]);

  return (
    <>
    {/* slim ticker of the newest cars — scrolls away with the page */}
    <div className="ticker" aria-label={t("ticker.new")}>
      <div className="ticker-track">
        {[0, 1].map((half) => (
          <div key={half} aria-hidden={half === 1} className="ticker-half">
            {newest.map((c, i) => (
              <Link
                key={`${c.slug}-${half}`}
                href={`/auto/${c.slug}`}
                tabIndex={half === 1 ? -1 : 0}
                className="ticker-item"
              >
                {i < 3 && <span className="ticker-new">{t("ticker.new")}</span>}
                <span>
                  {c.brand} {c.model} <span className="ticker-year">{c.year}</span>
                </span>
                <span className="ticker-price">{fmtPrice(c.price)}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
    <HeaderShell>
      <div className="site-header-in">
        <Link href="/" aria-label={site.name} className="site-logo">
          {/* the real logo: white text over the home hero, ink on the white bar */}
          <Logo variant="dark" markClassName="logo-img logo-on-dark" />
          <Logo markClassName="logo-img logo-on-light" />
        </Link>

        <NavMenu latest={latest} />

        <div className="site-actions">
          <LocaleSwitcher />
          <OpenNowBadge className="open-now" />
          <a href={tel} className="hdr-call">
            <HandsetIcon className="h-4 w-4" />
            {site.phoneDisplay[0]}
          </a>
          <a href={tel} className="hdr-call-sm" aria-label={`${t("common.call")} ${site.phoneDisplay[0]}`}>
            <HandsetIcon className="h-[18px] w-[18px]" />
          </a>
          <MobileMenu />
        </div>
      </div>
    </HeaderShell>
    </>
  );
}
