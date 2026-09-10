"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

const PRICE_STEPS = [5000, 7500, 10000, 15000, 20000, 30000, 50000];

export function QuickSearch({
  brands,
}: {
  brands: { brand: string; count: number }[];
}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [priceMax, setPriceMax] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (priceMax) params.set("priceMax", priceMax);
    router.push(`/auto${params.size ? `?${params}` : ""}`);
  }

  const selectCls =
    "h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none transition-colors focus:border-ink";

  const chips = [
    { label: t("chips.suv"), query: "body=suv" },
    { label: t("chips.diesel"), query: "fuel=diesel" },
    { label: t("chips.automatic"), query: "transmission=automatic" },
    { label: t("chips.hybrid"), query: "fuel=hybrid" },
    { label: t("chips.under10k"), query: "priceMax=10000" },
  ];

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card sm:p-5">
      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("searchBrand")}
          </span>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={selectCls}
          >
            <option value="">{t("searchAny")}</option>
            {brands.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand} ({b.count})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("searchModel")}
          </span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("searchAny")}
            className={selectCls}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("searchPriceMax")}
          </span>
          <select
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className={selectCls}
          >
            <option value="">{t("searchAny")}</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>
                {new Intl.NumberFormat("ro-RO").format(p)} €
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-accent font-display text-sm font-bold text-white transition-colors hover:bg-accent-deep"
          >
            {t("searchButton")}
          </button>
        </div>
      </form>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.query}
            href={`/auto?${chip.query}`}
            className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
