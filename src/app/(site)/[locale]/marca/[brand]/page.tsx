import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { brandFromSlug, brandSlug, fmtPrice, getBrandsWithCounts } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { site, telHref } from "@/lib/site";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import { CarCard } from "@/components/CarCard";
import { BrandRow } from "@/components/home/BrandRow";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons";

// SEO landing per brand: /marca/bmw — "BMW de vânzare în Chișinău"
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}): Promise<Metadata> {
  const { locale, brand: slug } = await params;
  const found = await brandFromSlug(slug);
  if (!found) return {};
  const t = await getTranslations({ locale, namespace: "brand" });
  const path = `/marca/${slug}`;
  return {
    title: { absolute: t("metaTitle", { brand: found.brand, count: found.count }) },
    description: t("metaDescription", { brand: found.brand, count: found.count }),
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: localizedAlternates(path).languages,
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}) {
  const { locale, brand: slug } = await params;
  setRequestLocale(locale);
  const found = await brandFromSlug(slug);
  if (!found) notFound();
  const t = await getTranslations();

  const [cars, brands] = await Promise.all([
    prisma.car.findMany({
      where: { status: "PUBLISHED", brand: found.brand },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        _count: { select: { images: true } },
      },
    }),
    getBrandsWithCounts(),
  ]);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("brand.title", { brand: found.brand }),
    itemListElement: cars.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${site.url}${locale === "ru" ? "/ru" : ""}/auto/${c.slug}`,
      name: `${c.brand} ${c.model} ${c.year}`,
      image: c.images[0] ? imageUrl(c.images[0].path, "lg") : undefined,
      offers: { "@type": "Offer", price: c.price, priceCurrency: "EUR" },
    })),
  };

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-6 sm:px-6 sm:pt-8">
      <nav className="flex items-center gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link>
        <span aria-hidden>/</span>
        <Link href="/auto" className="hover:text-ink">{t("nav.catalog")}</Link>
        <span aria-hidden>/</span>
        <span className="text-ink-soft">{found.brand}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
            {t("brand.title", { brand: found.brand })}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t("brand.intro", { brand: found.brand, count: cars.length })}
          </p>
        </div>
        <Link href={`/auto?brand=${encodeURIComponent(found.brand)}`} className="link-more">
          {t("catalog.filters")}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5">
        <BrandRow brands={brands} active={found.brand} />
      </div>

      {cars.length === 0 ? (
        <div className="card mt-8 rounded-2xl px-6 py-14 text-center">
          <p className="text-ink-soft">{t("brand.empty", { brand: found.brand })}</p>
          <a href={telHref(site.phones[0])} className="btn-primary mt-5 tabular-nums">
            <PhoneIcon className="h-4 w-4" />
            {site.phoneDisplay[0]}
          </a>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {cars.map((car, i) => (
            <CarCard key={car.id} car={car} priority={i < 4} />
          ))}
        </div>
      )}

      {/* price range line for the search snippet */}
      {cars.length > 1 && (
        <p className="mt-6 text-sm text-ink-faint">
          {found.brand}: {fmtPrice(Math.min(...cars.map((c) => c.price)))} –{" "}
          {fmtPrice(Math.max(...cars.map((c) => c.price)))} ·{" "}
          {Math.min(...cars.map((c) => c.year))}–{Math.max(...cars.map((c) => c.year))}
        </p>
      )}

      <section className="mt-14 border-t border-line pt-10">
        <SectionHeader title={t("brand.otherBrands")} href="/auto" linkLabel={t("brand.allCars")} />
        <div className="mt-5 flex flex-wrap gap-2">
          {brands
            .filter((b) => b.brand !== found.brand)
            .map((b) => (
              <Link
                key={b.brand}
                href={`/marca/${brandSlug(b.brand)}`}
                className="chip-3d rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink hover:text-accent"
              >
                {b.brand} <span className="text-ink-faint">{b.count}</span>
              </Link>
            ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </div>
  );
}
