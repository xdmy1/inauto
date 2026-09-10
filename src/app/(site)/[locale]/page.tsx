import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getBrandsWithCounts } from "@/lib/cars";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import { getPathname } from "@/i18n/navigation";
import { CarCard } from "@/components/CarCard";
import { QuickSearch } from "@/components/QuickSearch";
import {
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  WhatsAppIcon,
} from "@/components/icons";
import {
  CoinsIllo,
  ContractIllo,
  IconSpot,
  OdometerIllo,
  SteeringIllo,
} from "@/components/illustrations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, ""),
      languages: localizedAlternates("").languages,
    },
  };
}

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <Link
        href={href}
        className="btn-dark h-10 shrink-0 gap-1.5 px-4 text-[13px]"
      >
        {linkLabel}
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const WHY_ILLOS = {
  verified: OdometerIllo,
  financing: CoinsIllo,
  testdrive: SteeringIllo,
  docs: ContractIllo,
} as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [count, latest, hot, brands, popular] = await Promise.all([
    prisma.car.count({ where: { status: "PUBLISHED" } }),
    prisma.car.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
    prisma.car.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ oldPrice: { not: null } }, { featured: true }],
      },
      orderBy: [{ oldPrice: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
    getBrandsWithCounts(),
    prisma.car.findMany({
      where: { status: "PUBLISHED" },
      select: { brand: true, model: true },
      orderBy: { price: "desc" },
      take: 7,
    }),
  ]);

  return (
    <>
      {/* Hero: search + count panel */}
      <section className="mx-auto max-w-[1360px] sm:px-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] lg:gap-5">
          {/* photo — full-bleed on phones, card on desktop */}
          <div
            data-reveal
            className="relative order-first h-[340px] overflow-hidden sm:h-[380px] sm:rounded-2xl lg:order-last lg:h-auto lg:min-h-[420px]"
          >
            <img
              src="/images/hero.webp"
              alt={`${site.name} — ${site.address.full}`}
              width={1400}
              height={1120}
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent" />
            {/* seam: photo melts into the light page on phones */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent lg:hidden" />
            <div className="absolute bottom-0 left-0 p-5 pb-16 text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.65)] sm:p-7 sm:pb-20 lg:pb-7">
              <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {t("common.tagline")}
              </h2>
              <p className="mt-2 text-sm font-semibold text-white sm:text-base">
                {t("home.heroLine", { count })}
              </p>
            </div>
          </div>

          {/* search — overlaps the photo on phones */}
          <div
            data-reveal
            className="relative z-10 -mt-10 px-4 sm:px-0 lg:mt-0 lg:h-full"
          >
            <div className="h-full rounded-2xl shadow-lift lg:shadow-card">
              <QuickSearch brands={brands} count={count} />
            </div>
          </div>
        </div>

        {/* quick text search + popular presets */}
        <div data-reveal className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-0">
          <form
            action={getPathname({ locale, href: "/auto" })}
            className="relative hidden min-w-[280px] flex-1 lg:block"
          >
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              name="q"
              placeholder={t("home.searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-line bg-card pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink"
            />
          </form>
          <span className="text-sm font-bold">{t("home.popular")}</span>
          {popular.slice(0, 5).map((p) => (
            <Link
              key={`${p.brand}-${p.model}`}
              href={`/auto?brand=${encodeURIComponent(p.brand)}&model=${encodeURIComponent(p.model.split(" ")[0])}`}
              className="chip-3d inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <SearchIcon className="h-3 w-3" />
              {p.brand} {p.model.split(" ")[0]}
            </Link>
          ))}
        </div>
      </section>

      {/* Hot offers */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="mt-12">
          <SectionHeader
            title={t("home.hotOffers")}
            href="/auto?sort=price_desc"
            linkLabel={t("home.allOffers")}
          />
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hot.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      {/* Financing banner */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div data-reveal className="mt-12 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-accent-deep to-accent px-6 py-8 text-white sm:flex-row sm:items-center sm:px-9">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {t("home.financeTitle")}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm text-white/85">
              {t("home.financeText")}
            </p>
          </div>
          <a
            href={telHref(site.phones[0])}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 font-display text-sm font-bold text-accent-deep transition-transform active:scale-[0.98]"
          >
            <PhoneIcon className="h-4 w-4" />
            {site.phoneDisplay[0]}
          </a>
        </div>
      </section>

      {/* Latest */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="mt-12">
          <SectionHeader
            title={t("home.latestTitle")}
            href="/auto"
            linkLabel={t("home.allCars")}
          />
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      {/* Why us — compact strip */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(WHY_ILLOS) as (keyof typeof WHY_ILLOS)[]).map((key) => {
            const Illo = WHY_ILLOS[key];
            return (
              <div key={key} className="flex items-center gap-4 bg-card p-5">
                <IconSpot>
                  <Illo />
                </IconSpot>
                <div>
                  <h3 className="text-sm font-bold">{t(`home.why.${key}`)}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {t(`home.why.${key}Text`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact strip */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div data-reveal className="mt-12 rounded-2xl border border-line bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                {t("home.contactTitle")}
              </h2>
              <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft sm:flex-row sm:gap-6">
                <span className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-accent" />
                  {site.address.full}
                </span>
                <span className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-accent" />
                  Lu–Vi 9:00–18:00 · Sâ 9:00–15:00 · Du 9:00–13:00
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={telHref(site.phones[0])} className="btn-primary">
                <PhoneIcon className="h-4 w-4" />
                {site.phoneDisplay[0]}
              </a>
              <a
                href={waHref(site.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <WhatsAppIcon className="h-4.5 w-4.5 text-ok" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
