import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { brandSlug, equipmentList, fmtEngine, fmtKm, fmtPrice } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { nnnAdvertUrl } from "@/lib/nnn/client";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates, vehicleJsonLd } from "@/lib/seo";
import { Gallery } from "@/components/Gallery";
import { CarCard } from "@/components/CarCard";
import { ShareButton } from "@/components/ShareButton";
import { SectionHeader } from "@/components/home/SectionHeader";
import {
  CheckIcon,
  ClockIcon,
  ExternalIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/icons";

async function getCar(slug: string) {
  return prisma.car.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "RESERVED", "SOLD"] } },
    include: { images: { orderBy: { order: "asc" } }, advert: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const car = await getCar(slug);
  if (!car) return {};
  const name = `${car.brand} ${car.model} ${car.year}`;
  // the words the old inauto.md ranked on: model + Chișinău + Moldova + INAUTO
  const title =
    locale === "ru"
      ? `${name} — ${fmtPrice(car.price)}, продажа в Кишинёве`
      : `${name} de vânzare în Chișinău — ${fmtPrice(car.price)}`;
  const lead =
    locale === "ru"
      ? `${name}, ${fmtPrice(car.price)} — INAUTO, автопарк в Кишинёве (Молдова). `
      : `${name}, ${fmtPrice(car.price)} — INAUTO, parc auto în Chișinău (Moldova). `;
  const body = (locale === "ru" ? car.descriptionRu : car.descriptionRo).replace(/\s+/g, " ").trim();
  const description = (lead + body).slice(0, 158);
  const og = car.images[0] ? [imageUrl(car.images[0].path, "lg")] : [];
  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
    keywords: [`${car.brand} ${car.model}`, locale === "ru" ? "Кишинёв" : "Chișinău", "Moldova", "inauto.md"],
    alternates: {
      canonical: canonicalFor(locale, `/auto/${slug}`),
      languages: localizedAlternates(`/auto/${slug}`).languages,
    },
    openGraph: { title, description, images: og },
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const car = await getCar(slug);
  if (!car) notFound();

  // one row of similar cars: same brand first, then closest price, topped
  // up with the newest listings so the row is always full
  const cardInclude = {
    images: { orderBy: { order: "asc" as const }, take: 1 },
    _count: { select: { images: true } },
  };
  const similar = await prisma.car.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: car.id },
      OR: [
        { brand: car.brand },
        { price: { gte: car.price * 0.7, lte: car.price * 1.3 } },
      ],
    },
    take: 4,
    include: cardInclude,
  });
  if (similar.length < 4) {
    const fill = await prisma.car.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: [car.id, ...similar.map((s) => s.id)] },
      },
      orderBy: { createdAt: "desc" },
      take: 4 - similar.length,
      include: cardInclude,
    });
    similar.push(...fill);
  }
  similar.sort((a, b) => {
    const brandDiff = Number(b.brand === car.brand) - Number(a.brand === car.brand);
    if (brandDiff !== 0) return brandDiff;
    return Math.abs(a.price - car.price) - Math.abs(b.price - car.price);
  });

  const description = locale === "ru" ? car.descriptionRu || car.descriptionRo : car.descriptionRo || car.descriptionRu;
  const equipment = equipmentList(
    locale === "ru" ? car.equipmentRu || car.equipmentRo : car.equipmentRo || car.equipmentRu
  );
  const name = `${car.brand} ${car.model}`;
  const discounted = !!car.oldPrice && car.oldPrice > car.price;
  const unavailable = car.status !== "PUBLISHED";
  const nnnUrl =
    car.advert?.advertId &&
    car.advert.advertId !== "DRY-RUN" &&
    car.advert.state === "SYNCED" &&
    car.advert.nnnState !== "hidden" &&
    car.advert.nnnState !== "deleted"
      ? nnnAdvertUrl(car.advert.advertId, locale === "ru" ? "ru" : "ro")
      : null;

  const summary = [
    fmtKm(car.mileage),
    car.engineCc ? fmtEngine(car.engineCc) : null,
    t(`options.fuel.${car.fuel}`),
    car.powerHp ? `${car.powerHp} CP` : null,
    t(`options.transmission.${car.transmission}`),
    car.drivetrain === "awd" ? "4x4" : null,
  ].filter(Boolean);

  const specs: { label: string; value: string | null }[] = [
    { label: t("common.year"), value: String(car.year) },
    { label: t("common.mileage"), value: fmtKm(car.mileage) },
    { label: t("common.fuel"), value: t(`options.fuel.${car.fuel}`) },
    { label: t("common.transmission"), value: t(`options.transmission.${car.transmission}`) },
    { label: t("common.engine"), value: car.engineCc ? `${fmtEngine(car.engineCc)} · ${car.engineCc} cm³` : null },
    { label: t("common.power"), value: car.powerHp ? `${car.powerHp} CP` : null },
    { label: t("common.drivetrain"), value: car.drivetrain ? t(`options.drivetrain.${car.drivetrain}`) : null },
    { label: t("common.body"), value: t(`options.body.${car.body}`) },
    { label: t("common.color"), value: car.color },
    { label: t("common.seats"), value: car.seats ? String(car.seats) : null },
    { label: "VIN", value: car.vin },
  ];

  const trust = ["verified", "docs", "financing", "testdrive"] as const;

  return (
    <div data-hide-fab className="mx-auto max-w-[1360px] px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:pb-0">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link>
        <span aria-hidden>/</span>
        <Link href="/auto" className="hover:text-ink">{t("nav.catalog")}</Link>
        <span aria-hidden>/</span>
        <Link href={`/marca/${brandSlug(car.brand)}`} className="hover:text-ink">{car.brand}</Link>
        <span aria-hidden>/</span>
        <span className="text-ink-soft">{car.model} {car.year}</span>
      </nav>

      {/* Title row */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
            {name}
            <span className="year-chip text-sm sm:text-base">{car.year}</span>
            {unavailable && (
              <span className="rounded-md bg-ink px-2.5 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-white">
                {car.status === "SOLD" ? t("common.sold") : t("common.reserved")}
              </span>
            )}
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft">{summary.join(" · ")}</p>
          {/* price up top on phones (the sidebar card comes after the gallery) */}
          <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1 lg:hidden">
            <span className="price-box price-box-lg">{fmtPrice(car.price)}</span>
            {discounted && (
              <span className="pb-1.5 text-sm text-ink-faint line-through">{fmtPrice(car.oldPrice!)}</span>
            )}
            {car.downPayment != null && (
              <span className="pb-1.5 text-[13px] text-ink-soft">
                {t("common.downFrom", { amount: fmtPrice(car.downPayment) })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton title={`${name} ${car.year}`} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="min-w-0">
          <Gallery images={car.images} alt={`${name} ${car.year}`} />

          {/* trust row */}
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {trust.map((k) => (
              <li key={k} className="card flex items-center gap-2.5 px-3.5 py-3 text-[13px] font-semibold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper">
                  <CheckIcon className="h-3.5 w-3.5 text-ok" />
                </span>
                {t(`car.trust.${k}`)}
              </li>
            ))}
          </ul>

          {/* Specs */}
          <section className="mt-10">
            <h2 className="section-title">{t("car.specs")}</h2>
            <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {specs
                .filter((s) => s.value)
                .map((s) => (
                  <div key={s.label} className="spec-tile">
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {/* Equipment */}
          {equipment.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title">{t("car.equipment")}</h2>
              <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 md:grid-cols-3">
                {equipment.map((e) => (
                  <li key={e} className="flex items-start gap-2.5 text-[14px] text-ink">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    {e}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Description */}
          {description && (
            <section className="mt-10">
              <h2 className="section-title">{t("car.description")}</h2>
              <div className="card mt-5 whitespace-pre-line rounded-2xl p-5 text-[15px] leading-relaxed text-ink-soft sm:p-6">
                {description}
              </div>
            </section>
          )}
        </div>

        {/* Price + contact — sticky on desktop */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="card rounded-2xl p-6 shadow-lift">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="price-box price-box-lg">{fmtPrice(car.price)}</span>
                {discounted && (
                  <span className="pb-1.5 text-base text-ink-faint line-through">
                    {fmtPrice(car.oldPrice!)}
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-xs text-ink-faint">{t("car.priceIncludes")}</p>

              {(car.downPayment != null || car.monthlyRate) && (
                <dl className="mt-4 divide-y divide-line rounded-xl border border-line text-sm">
                  {car.downPayment != null && (
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <dt className="text-ink-soft">{t("common.downPayment")}</dt>
                      <dd className="font-bold">{fmtPrice(car.downPayment)}</dd>
                    </div>
                  )}
                  {car.monthlyRate ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <dt className="text-ink-soft">{t("common.perMonth").replace("/", "")}</dt>
                      <dd className="font-bold">{t("common.monthly", { amount: fmtPrice(car.monthlyRate) })}</dd>
                    </div>
                  ) : null}
                </dl>
              )}

              <div className="mt-5 space-y-2.5">
                <a href={telHref(site.phones[0])} className="btn-primary w-full tabular-nums">
                  <PhoneIcon className="h-4 w-4" />
                  {t("common.call")} · {site.phoneDisplay[0]}
                </a>
                <a
                  href={waHref(site.whatsapp, `${name} ${car.year} — ${site.url}/auto/${car.slug}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 text-ok" />
                  {t("common.whatsapp")}
                </a>
                {nnnUrl && (
                  <a
                    href={nnnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
                  >
                    <ExternalIcon className="h-3.5 w-3.5" />
                    {t("car.on999")}
                  </a>
                )}
              </div>
            </div>

            <div className="card rounded-2xl p-5">
              <h3 className="font-display text-sm font-bold">{t("car.visit")}</h3>
              <p className="mt-2.5 flex items-start gap-2.5 text-sm text-ink-soft">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {car.location ?? site.address.full}
              </p>
              <p className="mt-2 flex items-start gap-2.5 text-sm text-ink-soft">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {t("home.contactHours")}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {site.phones.map((p, i) => (
                  <a key={p} href={telHref(p)} className="font-semibold tabular-nums hover:text-accent">
                    {site.phoneDisplay[i]}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <SectionHeader title={t("car.similar")} href="/auto" linkLabel={t("car.backToCatalog")} />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {similar.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </section>
      )}

      {/* sticky call bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-lift backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-extrabold leading-none tracking-tight text-accent">
              {fmtPrice(car.price)}
            </div>
            <div className="mt-1 truncate text-[11.5px] text-ink-soft">
              {car.downPayment != null
                ? t("common.downFrom", { amount: fmtPrice(car.downPayment) })
                : `${name} ${car.year}`}
            </div>
          </div>
          <a
            href={waHref(site.whatsapp, `${name} ${car.year} — ${site.url}/auto/${car.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="btn-wa flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
          <a href={telHref(site.phones[0])} className="btn-primary h-11 shrink-0 px-5">
            <PhoneIcon className="h-4 w-4" />
            {t("common.call")}
          </a>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            vehicleJsonLd({
              ...car,
              imageUrls: car.images.map((i) => {
                const u = imageUrl(i.path, "lg");
                return u.startsWith("http") ? u : `${site.url}${u}`;
              }),
            })
          ),
        }}
      />
    </div>
  );
}
