"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { SearchIcon } from "./icons";

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
          <span className="field-label">{t("searchBrand")}</span>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="select"
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
          <span className="field-label">{t("searchModel")}</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("searchAny")}
            className="input"
          />
        </label>

        <label className="block">
          <span className="field-label">{t("searchPriceMax")}</span>
          <select
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="select"
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
          <button type="submit" className="btn-primary h-11 w-full">
            <SearchIcon className="h-4 w-4" />
            {t("searchButton")}
          </button>
        </div>
      </form>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.query}
            href={`/auto?${chip.query}`}
            className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
