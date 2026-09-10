"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowRightIcon } from "./icons";
import { FUELS } from "@/lib/cars";

const PRICE_STEPS = [5000, 7500, 10000, 15000, 20000, 30000, 50000];

export function QuickSearch({
  brands,
  count,
}: {
  brands: { brand: string; count: number }[];
  count: number;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [fuel, setFuel] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (priceMax) params.set("priceMax", priceMax);
    if (fuel) params.set("fuel", fuel);
    router.push(`/auto${params.size ? `?${params}` : ""}`);
  }

  const darkField =
    "h-11 w-full rounded-lg border border-white/15 bg-white/[0.07] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50";
  const darkSelect = `${darkField} cursor-pointer appearance-none pr-9 [&>option]:text-ink`;
  const chevron = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.55' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.7rem center",
  } as const;

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col rounded-2xl bg-ink p-5 text-white sm:p-6"
    >
      <h2 className="font-display text-lg font-bold">{t("home.searchTitle")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="col-span-2 block sm:col-span-1">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchBrand")}
          </span>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={darkSelect}
            style={chevron}
          >
            <option value="">{t("home.searchAny")}</option>
            {brands.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand} ({b.count})
              </option>
            ))}
          </select>
        </label>

        <label className="col-span-2 block sm:col-span-1">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchModel")}
          </span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("home.searchAny")}
            className={darkField}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchPriceMax")}
          </span>
          <select
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className={darkSelect}
            style={chevron}
          >
            <option value="">{t("home.searchAny")}</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>
                {new Intl.NumberFormat("ro-RO").format(p)} €
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchFuel")}
          </span>
          <select
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className={darkSelect}
            style={chevron}
          >
            <option value="">{t("home.searchAny")}</option>
            {FUELS.map((f) => (
              <option key={f} value={f}>
                {t(`options.fuel.${f}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="btn-primary mt-5 w-full">
        {t("home.showCars", { count })}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
