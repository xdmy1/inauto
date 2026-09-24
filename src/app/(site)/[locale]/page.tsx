import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import {
  CARS_ONLY,
  getBodyCounts,
  getBrandsWithCounts,
  getBudgetCounts,
} from "@/lib/cars";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import { CarCard } from "@/components/CarCard";
import { QuickSearch } from "@/components/QuickSearch";
import { HeroFx } from "@/components/hero/HeroFx";
import { SectionHeader } from "@/components/home/SectionHeader";
import { StatsStrip } from "@/components/home/StatsStrip";
import { BodyTypes } from "@/components/home/BodyTypes";
import { Spotlight } from "@/components/home/Spotlight";
import { BrandRow } from "@/components/home/BrandRow";
import { BudgetRow } from "@/components/home/BudgetRow";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
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

const WHY_ILLOS = {
  verified: OdometerIllo,
  financing: CoinsIllo,
  testdrive: SteeringIllo,
  docs: ContractIllo,
} as const;

const cardInclude = {
  images: { orderBy: { order: "asc" as const }, take: 3 },
  _count: { select: { images: true } },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [count, carCount, carBrands, latest, featured, brands, bodies, budgets] = await Promise.all([
    prisma.car.count({ where: { status: "PUBLISHED" } }),
    prisma.car.count({ where: { status: "PUBLISHED", ...CARS_ONLY } }),
    getBrandsWithCounts(CARS_ONLY),
    prisma.car.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: cardInclude,
    }),
    prisma.car.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ featured: true }, { oldPrice: { not: null } }],
      },
      orderBy: [{ featured: "desc" }, { oldPrice: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        images: { orderBy: { order: "asc" as const } },
        _count: { select: { images: true } },
      },
    }),
    getBrandsWithCounts(),
    getBodyCounts(),
    getBudgetCounts(),
  ]);

  const spotlight = featured[0] ?? null;
  const hot = featured.slice(1, 5);
  const trust = ["verified", "financing", "docs"] as const;
  const wrap = "mx-auto max-w-[1360px] px-4 sm:px-6";

  return (
    <>
      {/* ——— Hero: the real parking, the real count, the real slogan ——— */}
      <section className="hero relative overflow-hidden bg-ink text-white">
        <HeroFx />
        <div className="hero-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero.webp"
            alt={`${site.name} — ${site.address.full}`}
            width={1280}
            height={960}
            fetchPriority="high"
            className="hero-photo h-full w-full object-cover object-top lg:object-center"
          />
        </div>
        <div className={`hero-copy ${wrap} relative -mt-12 pb-24 sm:-mt-16 sm:pb-28 lg:mt-0 lg:pb-36 lg:pt-20`}>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white/70 sm:text-[12px] sm:tracking-[0.18em]">
            {t("home.heroEyebrow")}
          </p>
          <h1 className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="font-display text-[84px] font-extrabold leading-[0.85] tracking-[-0.04em] sm:text-[120px]">
              {count}
            </span>
            <span className="max-w-[300px] pb-1.5 font-display text-[22px] font-extrabold leading-[1.1] tracking-tight sm:text-[28px]">
              {t("home.heroCountLabel", { count })}
              <span className="block text-white/55">{t("common.city")}</span>
            </span>
          </h1>
          <p className="mt-5 font-display text-2xl font-extrabold tracking-tight text-accent sm:text-3xl">
            {t("common.tagline")}
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80 sm:text-base">
            {t("home.heroSub")}
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {trust.map((k) => (
              <li key={k} className="flex items-center gap-2 text-[13.5px] font-semibold text-white/90">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <CheckIcon className="h-3 w-3 text-white" />
                </span>
                {t(`home.why.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* search bar overlapping the hero */}
      <div className={`${wrap} relative z-10 -mt-14 sm:-mt-16`}>
        <QuickSearch brands={carBrands} count={carCount} />
      </div>

      {/* numbers */}
      <section className={`${wrap} mt-8`}>
        <StatsStrip count={count} />
      </section>

      {/* latest */}
      <section className={`${wrap} mt-14`}>
        <SectionHeader
          title={t("home.latestTitle")}
          text={t("home.latestText")}
          href="/auto"
          linkLabel={t("home.viewCatalog")}
        />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {latest.map((car, i) => (
            <CarCard key={car.id} car={car} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* spotlight */}
      {spotlight && (
        <section className={`${wrap} mt-14`}>
          <Spotlight car={spotlight} />
        </section>
      )}

      {/* body types + budgets */}
      <section className={`${wrap} mt-14`}>
        <SectionHeader title={t("home.bodyTitle")} />
        <div className="mt-5">
          <BodyTypes counts={bodies} />
        </div>
        <div className="mt-8">
          <SectionHeader title={t("home.budgetTitle")} />
          <div className="mt-5">
            <BudgetRow budgets={budgets} />
          </div>
        </div>
      </section>

      {/* hot offers */}
      {hot.length > 0 && (
        <section className={`${wrap} mt-14`}>
          <SectionHeader
            title={t("home.hotOffers")}
            text={t("home.hotText")}
            href="/auto?sort=price_asc"
            linkLabel={t("home.allOffers")}
          />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {hot.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      )}

      {/* financing */}
      <section className={wrap}>
        <div
          data-reveal
          className="mt-14 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-accent-deep to-accent px-6 py-8 text-white sm:flex-row sm:items-center sm:px-9"
        >
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {t("home.financeTitle")}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm text-white/85">
              {t("home.financeText")}
            </p>
          </div>
          <a href={telHref(site.phones[0])} className="btn-white shrink-0 tabular-nums">
            <PhoneIcon className="h-4 w-4" />
            {site.phoneDisplay[0]}
          </a>
        </div>
      </section>

      {/* why us */}
      <section className={`${wrap} mt-14`}>
        <SectionHeader title={t("home.whyTitle")} href="/despre" linkLabel={t("nav.about")} />
        <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(WHY_ILLOS) as (keyof typeof WHY_ILLOS)[]).map((key) => {
            const Illo = WHY_ILLOS[key];
            return (
              <div key={key} data-reveal className="flex items-center gap-4 bg-card p-5">
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

      {/* brands */}
      {brands.length > 0 && (
        <section className={`${wrap} mt-14`}>
          <SectionHeader title={t("home.brandsTitle")} />
          <div className="mt-5">
            <BrandRow brands={brands} showAll={false} />
          </div>
        </section>
      )}

      {/* visit us */}
      <section className={wrap}>
        <div data-reveal className="card mt-14 grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-[1fr_420px]">
          <div className="p-6 sm:p-8">
            <h2 className="section-title">{t("home.contactTitle")}</h2>
            <p className="section-sub">{t("home.contactText")}</p>
            <div className="mt-5 space-y-2.5 text-sm text-ink-soft">
              <p className="flex items-center gap-2.5">
                <MapPinIcon className="h-4 w-4 shrink-0 text-accent" />
                {site.address.full}
              </p>
              <p className="flex items-center gap-2.5">
                <ClockIcon className="h-4 w-4 shrink-0 text-accent" />
                {t("home.contactHours")}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={telHref(site.phones[0])} className="btn-primary tabular-nums">
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
              <Link href="/contacte" className="link-more self-center px-2">
                {t("home.mapCta")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <iframe
            title={site.address.full}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              `${site.address.street}, ${site.address.city}`
            )}&z=15&output=embed`}
            className="h-[260px] w-full border-t border-line lg:h-full lg:min-h-[300px] lg:border-l lg:border-t-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
