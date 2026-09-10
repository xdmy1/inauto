import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import {
  BODIES,
  DRIVETRAINS,
  FUELS,
  getBrandsWithCounts,
  getPublishedCars,
  parseFilters,
  TRANSMISSIONS,
} from "@/lib/cars";
import { canonicalFor, localizedAlternates } from "@/lib/seo";
import { CarCard } from "@/components/CarCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.catalog" });
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, "/auto"),
      languages: localizedAlternates("/auto").languages,
    },
  };
}

const inputCls = "input";

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
      </span>
      <select name={name} defaultValue={value ?? ""} className="select">
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({
  name,
  label,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  value?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
      </span>
      <input
        type="number"
        name={name}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        min={0}
        className={inputCls}
      />
    </label>
  );
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
  const [{ cars, total, pages }, brands] = await Promise.all([
    getPublishedCars(filters),
    getBrandsWithCounts(),
  ]);

  const action = getPathname({ locale, href: "/auto" });

  const pageHref = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string" && v !== "" && k !== "page") q.set(k, v);
    }
    if (page > 1) q.set("page", String(page));
    return `/auto${q.size ? `?${q}` : ""}`;
  };

  const sortOptions = [
    "new",
    "price_asc",
    "price_desc",
    "year_desc",
    "mileage_asc",
  ] as const;

  const filterForm = (
    <form action={action} className="space-y-3.5">
      <Select
        name="brand"
        label={t("home.searchBrand")}
        value={filters.brand}
        options={brands.map((b) => ({
          value: b.brand,
          label: `${b.brand} (${b.count})`,
        }))}
      />
      <label className="block">
        <span className="field-label">
          {t("home.searchModel")}
        </span>
        <input
          name="model"
          defaultValue={filters.model ?? ""}
          className={inputCls}
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <NumberInput name="priceMin" label={t("catalog.priceMin")} value={filters.priceMin} placeholder="0 €" />
        <NumberInput name="priceMax" label={t("catalog.priceMax")} value={filters.priceMax} placeholder="∞ €" />
        <NumberInput name="yearMin" label={t("catalog.yearMin")} value={filters.yearMin} placeholder="2000" />
        <NumberInput name="yearMax" label={t("catalog.yearMax")} value={filters.yearMax} placeholder="2026" />
      </div>
      <NumberInput
        name="mileageMax"
        label={t("catalog.mileageMax")}
        value={filters.mileageMax}
        placeholder="200 000 km"
      />
      <Select
        name="body"
        label={t("common.body")}
        value={filters.body}
        options={BODIES.map((b) => ({ value: b, label: t(`options.body.${b}`) }))}
      />
      <Select
        name="fuel"
        label={t("common.fuel")}
        value={filters.fuel}
        options={FUELS.map((f) => ({ value: f, label: t(`options.fuel.${f}`) }))}
      />
      <Select
        name="transmission"
        label={t("common.transmission")}
        value={filters.transmission}
        options={TRANSMISSIONS.map((x) => ({
          value: x,
          label: t(`options.transmission.${x}`),
        }))}
      />
      <Select
        name="drivetrain"
        label={t("common.drivetrain")}
        value={filters.drivetrain}
        options={DRIVETRAINS.map((x) => ({
          value: x,
          label: t(`options.drivetrain.${x}`),
        }))}
      />
      {filters.sort && filters.sort !== "new" && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="h-10 flex-1 rounded-lg bg-ink font-display text-sm font-bold text-paper transition-colors hover:bg-black"
        >
          {t("catalog.apply")}
        </button>
        <Link
          href="/auto"
          className="flex h-10 items-center rounded-lg border border-line px-3 text-sm font-medium text-ink-soft hover:border-ink hover:text-ink"
        >
          {t("catalog.reset")}
        </Link>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("catalog.title")}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t("catalog.found", { count: total })}
          </p>
        </div>

        {/* Sort — plain links keep this zero-JS */}
        <nav aria-label={t("catalog.sort.label")} className="flex flex-wrap gap-1.5">
          {sortOptions.map((s) => {
            const q = new URLSearchParams();
            for (const [k, v] of Object.entries(sp)) {
              if (typeof v === "string" && v !== "" && k !== "page" && k !== "sort")
                q.set(k, v);
            }
            if (s !== "new") q.set("sort", s);
            const active = filters.sort === s;
            return (
              <Link
                key={s}
                href={`/auto${q.size ? `?${q}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "border border-line bg-card text-ink-soft hover:text-ink"
                }`}
              >
                {t(`catalog.sort.${s}`)}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters — sidebar on desktop, collapsible on mobile */}
        <aside>
          <details className="group rounded-2xl border border-line bg-card p-4 lg:hidden" >
            <summary className="cursor-pointer list-none font-display text-sm font-bold">
              {t("catalog.filters")} ▾
            </summary>
            <div className="mt-4">{filterForm}</div>
          </details>
          <div className="sticky top-24 hidden rounded-2xl border border-line bg-card p-4 lg:block">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide">
              {t("catalog.filters")}
            </h2>
            {filterForm}
          </div>
        </aside>

        {/* Results */}
        <div>
          {cars.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card px-6 py-16 text-center">
              <p className="text-ink-soft">{t("catalog.empty")}</p>
              <Link
                href="/auto"
                className="mt-4 inline-block rounded-xl bg-ink px-5 py-2.5 font-display text-sm font-bold text-paper"
              >
                {t("catalog.emptyCta")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {filters.page! > 1 && (
                <Link
                  href={pageHref(filters.page! - 1)}
                  className="rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-medium hover:border-ink"
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
                  className="rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-medium hover:border-ink"
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
