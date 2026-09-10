import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { canonicalFor, localizedAlternates } from "@/lib/seo";

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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const count = await prisma.car.count({ where: { status: "PUBLISHED" } });

  const stats = [
    { value: String(count || "60+"), label: t("statsCars") },
    { value: "10+", label: t("statsYears") },
    { value: "2000+", label: t("statsClients") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <h1 className=" max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {t("title")}
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
        <div className="max-w-2xl space-y-5 text-[15px] leading-relaxed text-ink-soft sm:text-base">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>

        <div className="space-y-px overflow-hidden rounded-2xl border border-line bg-line">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-6 py-5">
              <div className="font-display text-3xl font-extrabold tracking-tight text-accent">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-ink-soft">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
