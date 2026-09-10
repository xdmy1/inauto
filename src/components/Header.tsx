import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { fmtPrice } from "@/lib/cars";
import { site, telHref } from "@/lib/site";
import { OpenNowBadge } from "./OpenNowBadge";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { PhoneIcon } from "./icons";

export async function Header() {
  const t = await getTranslations();

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/auto", label: t("nav.catalog") },
    { href: "/despre", label: t("nav.about") },
    { href: "/contacte", label: t("nav.contact") },
  ] as const;

  // live inventory ticker — the actual cars, stock-market style
  const tickerCars = await prisma.car.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { slug: true, brand: true, model: true, year: true, price: true },
  });

  return (
    <>
      {/* inventory ticker */}
      <div className="flex h-11 items-stretch bg-ink text-paper">
        <div className="z-10 hidden shrink-0 items-center border-r border-white/10 bg-ink pl-4 pr-5 sm:flex lg:pl-[max(1rem,calc((100vw-1360px)/2+1.5rem))]">
          <OpenNowBadge />
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-ink to-transparent" />
          <div className="flex h-full w-max animate-marquee">
            {[0, 1].map((half) => (
              <div
                key={half}
                aria-hidden={half === 1}
                className="flex h-full items-center"
              >
                {tickerCars.map((c, i) => (
                  <Link
                    key={`${c.slug}-${half}`}
                    href={`/auto/${c.slug}`}
                    tabIndex={half === 1 ? -1 : 0}
                    className="group/tick flex items-center gap-2.5 whitespace-nowrap px-6 text-[13.5px] font-light text-paper/80 transition-colors hover:text-white"
                  >
                    {i < 3 && (
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-white">
                        {t("ticker.new")}
                      </span>
                    )}
                    <span>
                      {c.brand} {c.model}{" "}
                      <span className="text-paper/45">{c.year}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-white group-hover/tick:text-accent">
                      {fmtPrice(c.price)}
                    </span>
                    <span className="pl-4 text-accent/70" aria-hidden>
                      ◆
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={site.name} className="shrink-0">
            <Logo markClassName="h-12 w-auto" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <LocaleSwitcher />
            <a
              href={telHref(site.phones[0])}
              className="chip-3d hidden h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold tabular-nums lg:flex"
            >
              <PhoneIcon className="h-4 w-4 text-accent" />
              {site.phoneDisplay[0]}
            </a>
            <Link
              href="/auto"
              className="btn-primary hidden h-10 px-4 md:flex"
            >
              {t("nav.catalog")}
            </Link>
            <MobileMenu
              items={nav.map((n) => ({ ...n }))}
              phone={site.phoneDisplay[0]}
              phoneHref={telHref(site.phones[0])}
            />
          </div>
        </div>
      </header>
    </>
  );
}
