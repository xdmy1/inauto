import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { fmtKm, fmtPrice } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { site, telHref, waHref } from "@/lib/site";
import { canonicalFor, localizedAlternates, vehicleJsonLd } from "@/lib/seo";
import { Gallery } from "@/components/Gallery";
import { CarCard } from "@/components/CarCard";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";

async function getCar(slug: string) {
  return prisma.car.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "RESERVED", "SOLD"] } },
    include: { images: { orderBy: { order: "asc" } } },
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
  const title = `${car.brand} ${car.model} ${car.year} — ${fmtPrice(car.price)}`;
  const description =
    (locale === "ru" ? car.descriptionRu : car.descriptionRo).slice(0, 155) ||
    title;
  const og = car.images[0] ? [imageUrl(car.images[0].path, "lg")] : [];
  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
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

  // up to 8 similar cars: same brand first, then closest price, topped up
  // with the newest listings so the section is never almost empty
  const similar = await prisma.car.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: car.id },
      OR: [
        { brand: car.brand },
        { price: { gte: car.price * 0.7, lte: car.price * 1.3 } },
      ],
    },
    take: 8,
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (similar.length < 8) {
    const fill = await prisma.car.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: [car.id, ...similar.map((s) => s.id)] },
      },
      orderBy: { createdAt: "desc" },
      take: 8 - similar.length,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    });
    similar.push(...fill);
  }
  similar.sort((a, b) => {
    const brandDiff =
      Number(b.brand === car.brand) - Number(a.brand === car.brand);
    if (brandDiff !== 0) return brandDiff;
    return Math.abs(a.price - car.price) - Math.abs(b.price - car.price);
  });

  const description = locale === "ru" ? car.descriptionRu : car.descriptionRo;
  const name = `${car.brand} ${car.model}`;

  const specs: { label: string; value: string | null }[] = [
    { label: t("common.year"), value: String(car.year) },
    { label: t("common.body"), value: t(`options.body.${car.body}`) },
    { label: t("common.fuel"), value: t(`options.fuel.${car.fuel}`) },
    {
      label: t("common.transmission"),
      value: t(`options.transmission.${car.transmission}`),
    },
    {
      label: t("common.drivetrain"),
      value: car.drivetrain ? t(`options.drivetrain.${car.drivetrain}`) : null,
    },
    { label: t("common.mileage"), value: fmtKm(car.mileage) },
    {
      label: t("common.engine"),
      value: car.engineCc ? `${car.engineCc} cm³` : null,
    },
    { label: t("common.power"), value: car.powerHp ? `${car.powerHp} CP` : null },
    { label: t("common.color"), value: car.color },
    { label: t("common.seats"), value: car.seats ? String(car.seats) : null },
  ];

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          {t("nav.home")}
        </Link>
        <span aria-hidden>/</span>
        <Link href="/auto" className="hover:text-ink">
          {t("nav.catalog")}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-soft">
          {name} {car.year}
        </span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <Gallery images={car.images} alt={`${name} ${car.year}`} />

          {/* Specs */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              {t("car.specs")}
            </h2>
            <dl className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-card sm:grid-cols-2">
              {specs
                .filter((s) => s.value)
                .map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                      i >= 2 ? "border-t border-line" : ""
                    } ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-l-line" : ""}`}
                  >
                    <dt className="text-sm text-ink-soft">{s.label}</dt>
                    <dd className="text-sm font-semibold">{s.value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {/* Description */}
          {description && (
            <section className="mt-10">
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                {t("car.description")}
              </h2>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {description}
              </div>
            </section>
          )}
        </div>

        {/* Price + contact — sticky on desktop */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                {name}{" "}
                <span className="font-bold text-ink-faint">{car.year}</span>
              </h1>
              <p className="mt-1.5 text-sm text-ink-soft">
                {t(`options.fuel.${car.fuel}`)} · {fmtKm(car.mileage)} ·{" "}
                {t(`options.transmission.${car.transmission}`)}
              </p>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold tracking-tight text-accent">
                  {fmtPrice(car.price)}
                </span>
                {car.oldPrice && car.oldPrice > car.price && (
                  <span className="text-base text-ink-faint line-through">
                    {fmtPrice(car.oldPrice)}
                  </span>
                )}
              </div>
              {car.downPayment != null && (
                <p className="mt-2 inline-block rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent-deep">
                  {t("car.downPaymentFrom", {
                    amount: fmtPrice(car.downPayment),
                  })}
                </p>
              )}

              <div className="mt-6 space-y-2.5">
                <a
                  href={telHref(site.phones[0])}
                  className="btn-primary w-full"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {t("common.call")} · {site.phoneDisplay[0]}
                </a>
                <a
                  href={waHref(
                    site.whatsapp,
                    `${name} ${car.year} — ${site.url}/auto/${car.slug}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 text-ok" />
                  {t("common.whatsapp")}
                </a>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-ink-faint">
                {t("car.atParking", { address: car.location ?? site.address.full })}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <h3 className="font-display text-sm font-bold">
                {t("car.contactTitle")}
              </h3>
              <p className="mt-1.5 text-sm text-ink-soft">
                {t("car.contactText")}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16">
          <div className="hairline flex items-end justify-between pt-10">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              {t("car.similar")}
            </h2>
            <Link
              href="/auto"
              className="text-sm font-semibold hover:text-accent"
            >
              {t("car.backToCatalog")} →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            vehicleJsonLd({
              ...car,
              imageUrls: car.images.map(
                (i) => `${site.url}${imageUrl(i.path, "lg")}`
              ),
            })
          ),
        }}
      />
    </div>
  );
}
