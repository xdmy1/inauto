import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, "/contacte"),
      languages: localizedAlternates("/contacte").languages,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.address.street}, ${site.address.city}`
  )}`;

  const rows = [
    {
      label: t("contact.hoursMoFr"),
      value: "09:00 – 18:00",
    },
    { label: t("contact.hoursSa"), value: "09:00 – 15:00" },
    { label: t("contact.hoursSu"), value: "09:00 – 13:00" },
  ];

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-14 sm:px-6">
      <h1 className=" font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        {t("contact.title")}
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Address + map */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            {t("contact.address")}
          </h2>
          <p className="mt-3 font-display text-lg font-bold">
            {site.address.full}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-deep"
          >
            {t("contact.mapCta")} →
          </a>
        </div>

        {/* Phones */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            {t("contact.phones")}
          </h2>
          <ul className="mt-3 space-y-2">
            {site.phones.map((p, i) => (
              <li key={p}>
                <a
                  href={telHref(p)}
                  className="font-display text-lg font-bold tabular-nums hover:text-accent"
                >
                  {site.phoneDisplay[i]}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={waHref(site.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold hover:border-ink"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${site.email}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold hover:border-ink"
            >
              {site.email}
            </a>
          </div>
        </div>

        {/* Hours */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            {t("contact.hours")}
          </h2>
          <dl className="mt-3 space-y-2.5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <dt className="text-sm text-ink-soft">{r.label}</dt>
                <dd className="text-sm font-semibold tabular-nums">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Map embed */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-line">
        <iframe
          title={t("contact.address")}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(
            `${site.address.street}, ${site.address.city}`
          )}&z=15&output=embed`}
          className="h-[380px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
