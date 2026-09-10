"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowRightIcon } from "./icons";
import { Select } from "./ui/Select";

const PRICE_STEPS = [5000, 7500, 10000, 15000, 20000, 30000, 50000];
const nf = new Intl.NumberFormat("ro-RO");

// Small, simple hero search — the full filter set lives on /auto
export function QuickSearch({
  brands,
  count: initialCount,
}: {
  brands: { brand: string; count: number }[];
  count: number;
}) {
  const t = useTranslations();
  const router = useRouter();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [count, setCount] = useState(initialCount);
  const debounce = useRef<number | undefined>(undefined);

  function buildParams() {
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (model) p.set("model", model);
    if (priceMax) p.set("priceMax", priceMax);
    return p;
  }

  // live result counter
  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/cars/count?${buildParams()}`);
        if (res.ok) setCount((await res.json()).count);
      } catch {
        /* keep previous count */
      }
    }, 250);
    return () => window.clearTimeout(debounce.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, model, priceMax]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = buildParams();
    router.push(`/auto${p.size ? `?${p}` : ""}`);
  }

  const label = "mb-1.5 block text-xs font-medium text-white/60";

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col rounded-2xl bg-ink p-6 text-white"
    >
      <h2 className="font-display text-xl font-bold">{t("home.searchTitle")}</h2>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className={label}>{t("home.searchBrand")}</span>
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

        <label className="block">
          <span className={label}>{t("home.searchModel")}</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("home.searchAny")}
            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.07] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50"
          />
        </label>

        <label className="block">
          <span className={label}>{t("home.searchPriceMax")}</span>
          <Select
            variant="dark"
            value={priceMax}
            onChange={setPriceMax}
            placeholder={t("home.searchAny")}
            options={PRICE_STEPS.map((p) => ({
              value: String(p),
              label: `${nf.format(p)} €`,
            }))}
          />
        </label>
      </div>

      <div className="mt-auto pt-6">
        <button type="submit" className="btn-primary w-full">
          {t("home.showCars", { count })}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <Link
          href="/auto"
          className="mt-3.5 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-white/60 transition-colors hover:text-white"
        >
          {t("home.advanced")}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </form>
  );
}
