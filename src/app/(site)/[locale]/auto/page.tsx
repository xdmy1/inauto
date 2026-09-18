import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import {
  BODIES,
  MINIBUS,
  MINIBUS_BODIES,
  getBrandsWithCounts,
  getPublishedCars,
  parseFilters,
} from "@/lib/cars";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import { CarCard } from "@/components/CarCard";
import { CatalogFilters } from "@/components/CatalogFilters";
import { SortSelect } from "@/components/SortSelect";
import { BrandRow } from "@/components/home/BrandRow";
import { prisma } from "@/lib/prisma";


/** translation key for the active body category, or null for the full catalog */
function bodyKey(body?: string | string[]) {
  if (typeof body !== "string" || body === "") return null;
  if (body === MINIBUS) return "minibus";
  return (BODIES as readonly string[]).includes(body) ? body : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "meta.catalog" });
  const tb = await getTranslations({ locale, namespace: "options.body" });
  const key = bodyKey(sp.body);
  const category = key ? tb(key) : null;
  return {
    title: { absolute: category ? t("titleBody", { body: category }) : t("title") },
    description: category
      ? t("descriptionBody", { body: category })
      : t("description"),
    alternates: {
      canonical: canonicalFor(locale, "/auto"),
      languages: localizedAlternates("/auto").languages,
    },
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations();

  const filters = parseFilters(sp);
  const categoryKey = bodyKey(sp.body);
  const categoryWhere =
    categoryKey === "minibus"
      ? { body: { in: [...MINIBUS_BODIES] } }
      : categoryKey
        ? { body: categoryKey }
        : undefined;
  const [{ cars, total, pages }, brands, colorRows] = await Promise.all([
    getPublishedCars(filters),
    getBrandsWithCounts(categoryWhere),
    prisma.car.findMany({
      where: { status: "PUBLISHED", color: { not: null } },
      select: { color: true },
      distinct: ["color"],
      orderBy: { color: "asc" },
    }),
  ]);
  const colors = colorRows.map((c) => c.color!).filter(Boolean);
  const action = getPathname({ locale, href: "/auto" });
  const category = categoryKey ? t(`options.body.${categoryKey}`) : null;

  const pageHref = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string" && v !== "" && k !== "page") q.set(k, v);
    }
    if (page > 1) q.set("page", String(page));
    return `/auto${q.size ? `?${q}` : ""}`;
  };

  const activeBrand = brands.find(
    (b) => b.brand.toLowerCase() === filters.brand?.toLowerCase()
  )?.brand;

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-6 sm:px-6 sm:pt-8">
      <nav className="flex items-center gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          {t("nav.home")}
        </Link>
        <span aria-hidden>/</span>
        {category ? (
          <>
            <Link href="/auto" className="hover:text-ink">
              {t("nav.catalog")}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-soft">{category}</span>
          </>
        ) : (
          <span className="text-ink-soft">{t("nav.catalog")}</span>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
            {category
              ? t("catalog.h1Body", { body: category })
              : t("catalog.h1")}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-semibold text-ink">{t("catalog.found", { count: total })}</span>
            {" · "}
            {categoryKey === "minibus"
              ? t("catalog.minibusSubtitle")
              : t("catalog.subtitle")}
          </p>
        </div>
        <SortSelect value={filters.sort ?? "new"} />
      </div>

      <div className="mt-5">
        <BrandRow
          brands={brands}
          active={activeBrand}
          scope={categoryKey ? `body=${sp.body as string}` : undefined}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[270px_1fr]">
        {/* filters */}
        <aside>
          <details className="card group rounded-2xl p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-sm font-bold">
              {t("catalog.filters")}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-ink-soft transition-transform group-open:rotate-180"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="mt-4 border-t border-line pt-4">
              <CatalogFilters action={action} brands={brands} colors={colors} filters={filters} />
            </div>
          </details>
          <div className="card sticky top-24 hidden rounded-2xl p-4 lg:block">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
              {t("catalog.filters")}
            </h2>
            <CatalogFilters action={action} brands={brands} colors={colors} filters={filters} />
          </div>
        </aside>

        {/* results */}
        <div>
          {cars.length === 0 ? (
            <div className="card rounded-2xl px-6 py-16 text-center">
              <p className="text-ink-soft">{t("catalog.empty")}</p>
              <Link href="/auto" className="btn-dark mt-4 h-11 px-5">
                {t("catalog.emptyCta")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:gap-5">
              {cars.map((car, i) => (
                <CarCard key={car.id} car={car} priority={i < 3} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {filters.page! > 1 && (
                <Link
                  href={pageHref(filters.page! - 1)}
                  className="chip-3d rounded-lg px-3.5 py-2 text-sm font-medium"
                >
                  ← {t("catalog.prev")}
                </Link>
              )}
              <span className="px-2 text-sm text-ink-soft tabular-nums">
                {filters.page} / {pages}
              </span>
              {filters.page! < pages && (
                <Link
                  href={pageHref(filters.page! + 1)}
                  className="chip-3d rounded-lg px-3.5 py-2 text-sm font-medium"
                >
                  {t("catalog.next")} →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
