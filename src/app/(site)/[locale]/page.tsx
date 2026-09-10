import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getBrandsWithCounts } from "@/lib/cars";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import { CarCard } from "@/components/CarCard";
import { QuickSearch } from "@/components/QuickSearch";

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

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span>{n}</span>
      <span className="h-px w-8 bg-line" />
      <span>{children}</span>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [count, latest, brands] = await Promise.all([
    prisma.car.count({ where: { status: "PUBLISHED" } }),
    prisma.car.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
    getBrandsWithCounts(),
  ]);

  const why = [
    { key: "verified" },
    { key: "financing" },
    { key: "testdrive" },
    { key: "docs" },
  ] as const;

  const steps = [
    { n: "1", key: "one" },
    { n: "2", key: "two" },
    { n: "3", key: "three" },
  ] as const;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
        <div className="max-w-3xl">
          <p className="section-label">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span>{t("home.heroCount", { count })}</span>
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {t.rich("home.heroTitle", {
              accent: (chunks) => <span className="text-accent">{chunks}</span>,
            })}
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink-soft sm:text-lg">
            {t("home.heroSubtitle")}
          </p>
        </div>

        <div className="mt-9">
          <QuickSearch brands={brands} />
        </div>
      </section>

      {/* Latest cars */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="hairline flex items-end justify-between pt-10">
          <div>
            <SectionLabel n="01">{t("home.latestLabel")}</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t("home.latestTitle")}
            </h2>
          </div>
          <Link
            href="/auto"
            className="hidden items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-accent sm:flex"
          >
            {t("common.viewAll")}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>

        <div className="mt-8 sm:hidden">
          <Link
            href="/auto"
            className="flex h-12 items-center justify-center rounded-xl border border-ink font-display text-sm font-bold"
          >
            {t("common.viewAll")} →
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="hairline mt-16 pt-10">
          <SectionLabel n="02">{t("home.whyLabel")}</SectionLabel>
          <h2 className="mt-3 max-w-xl font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("home.whyTitle")}
          </h2>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {why.map((item, i) => (
            <div key={item.key} className="bg-card p-6">
              <div className="text-xs font-semibold text-ink-faint">
                0{i + 1}
              </div>
              <h3 className="mt-4 font-display text-base font-bold">
                {t(`home.why.${item.key}`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {t(`home.why.${item.key}Text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How to buy */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="hairline mt-16 pt-10">
          <SectionLabel n="03">{t("home.stepsLabel")}</SectionLabel>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("home.stepsTitle")}
          </h2>
        </div>
        <ol className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.key}
              className="rounded-2xl border border-line bg-card p-6 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-base font-extrabold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-base font-bold">
                {t(`home.steps.${s.key}`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {t(`home.steps.${s.key}Text`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Contact band */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-16 overflow-hidden rounded-3xl bg-ink px-6 py-12 text-paper sm:px-12">
          <SectionLabel n="04">{t("home.contactLabel")}</SectionLabel>
          <h2 className="mt-4 max-w-lg font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("home.contactTitle")}
          </h2>
          <p className="mt-3 max-w-md text-sm text-paper/70">
            {t("home.contactText")}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={telHref(site.phones[0])}
              className="flex h-12 items-center gap-2 rounded-xl bg-accent px-5 font-display text-sm font-bold text-white transition-colors hover:bg-accent-deep"
            >
              {t("common.call")} · {site.phoneDisplay[0]}
            </a>
            <a
              href={waHref(site.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center rounded-xl border border-paper/25 px-5 font-display text-sm font-bold text-paper transition-colors hover:border-paper/60"
            >
              {t("common.whatsapp")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
