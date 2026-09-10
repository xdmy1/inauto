"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowRightIcon } from "./icons";
import { Select } from "./ui/Select";
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
          <Select
            variant="dark"
            searchable
            value={brand}
            onChange={setBrand}
            placeholder={t("home.searchAny")}
            options={brands.map((b) => ({
              value: b.brand,
              label: `${b.brand} (${b.count})`,
            }))}
          />
        </label>

        <label className="col-span-2 block sm:col-span-1">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchModel")}
          </span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("home.searchAny")}
            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.07] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50"
          />
        </label>

        <div className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchPriceMax")}
          </span>
          <Select
            variant="dark"
            value={priceMax}
            onChange={setPriceMax}
            placeholder={t("home.searchAny")}
            options={PRICE_STEPS.map((p) => ({
              value: String(p),
              label: `${new Intl.NumberFormat("ro-RO").format(p)} €`,
            }))}
          />
        </div>

        <div className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/60">
            {t("home.searchFuel")}
          </span>
          <Select
            variant="dark"
            value={fuel}
            onChange={setFuel}
            placeholder={t("home.searchAny")}
            options={FUELS.map((f) => ({
              value: f,
              label: t(`options.fuel.${f}`),
            }))}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary mt-5 w-full">
        {t("home.showCars", { count })}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
