import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import {
  ArrowRightIcon,
  CheckIcon,
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
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, "/despre"),
      languages: localizedAlternates("/despre").languages,
    },
  };
}

const WHY_ILLOS = {
  verified: OdometerIllo,
  financing: CoinsIllo,
  testdrive: SteeringIllo,
  docs: ContractIllo,
} as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const count = await prisma.car.count({ where: { status: "PUBLISHED" } });

  const stats = [
    { value: String(count), label: t("about.statsCars") },
    { value: "7/7", label: t("about.statsDays") },
    { value: "100 €", label: t("about.statsDown") },
  ];

  const checks = [
    t("home.why.verified"),
    t("home.why.docs"),
    t("home.why.financing"),
    t("home.why.testdrive"),
  ];

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-12 sm:px-6 sm:pt-16">
      {/* intro + photo */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="max-w-xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t("about.title")}
          </h1>
          <div className="mt-6 max-w-xl space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-base">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
            <p>{t("about.p3")}</p>
          </div>

          <div className="mt-7 grid max-w-md grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {checks.map((c) => (
              <span
                key={c}
                className="flex items-center gap-2 text-sm font-medium text-ink-soft"
              >
                <CheckIcon className="h-4 w-4 shrink-0 text-ok" />
                {c}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auto" className="btn-primary">
              {t("home.showCars", { count })}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a href={telHref(site.phones[0])} className="btn-outline">
              <PhoneIcon className="h-4 w-4 text-accent" />
              {site.phoneDisplay[0]}
            </a>
          </div>
        </div>

        <div>
          <div className="overflow-hidden rounded-3xl shadow-lift">
            <img
              src="/images/hero.webp"
              alt={`${site.name} — ${site.address.full}`}
              width={1400}
              height={1120}
              className="aspect-[5/4] w-full object-cover"
            />
          </div>
          <div className="-mt-10 mx-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-lift sm:mx-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-card px-4 py-4 text-center">
                <div className="font-display text-2xl font-extrabold tracking-tight text-accent">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] leading-tight text-ink-soft">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* why strip */}
      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(WHY_ILLOS) as (keyof typeof WHY_ILLOS)[]).map((key) => {
          const Illo = WHY_ILLOS[key];
          return (
            <div key={key} className="flex items-start gap-4 bg-card p-5">
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

      {/* visit CTA */}
      <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-2xl bg-ink px-6 py-8 text-white sm:flex-row sm:items-center sm:px-9">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            {t("home.contactTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-white/70">{t("home.contactText")}</p>
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
            className="btn-wa inline-flex h-12 items-center gap-2 rounded-xl px-6 font-display text-sm font-bold text-white"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
