"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { FUELS } from "@/lib/cars";
import { ArrowRightIcon, SlidersIcon } from "./icons";
import { Select } from "./ui/Select";

const PRICE_STEPS = [3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 70000];
const nf = new Intl.NumberFormat("ro-RO");

// Hero search bar — one row on desktop (brand / model / price / fuel / CTA),
// live result counter, quick-filter chips underneath. Full filters on /auto.
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
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [fuel, setFuel] = useState("");
  const [count, setCount] = useState(initialCount);
  const debounce = useRef<number | undefined>(undefined);
  const first = useRef(true);

  function buildParams() {
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (model) p.set("model", model);
    if (priceMin) p.set("priceMin", priceMin);
    if (priceMax) p.set("priceMax", priceMax);
    if (fuel) p.set("fuel", fuel);
    return p;
  }

  // live result counter
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
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
  }, [brand, model, priceMin, priceMax, fuel]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = buildParams();
    router.push(`/auto${p.size ? `?${p}` : ""}`);
  }

  const quick = [
    { href: "/auto?fuel=diesel", label: t("options.fuel.diesel") },
    { href: "/auto?fuel=hybrid", label: t("options.fuel.hybrid") },
    { href: "/auto?transmission=automatic", label: t("options.transmission.automatic") },
    { href: "/auto?drivetrain=awd", label: "4x4" },
    { href: "/auto?body=suv", label: t("options.body.suv") },
    { href: "/auto?priceMax=10000", label: t("footer.under10k") },
  ];

  const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint";
  const priceOption = (p: number) => ({ value: String(p), label: `${nf.format(p)} €` });
  // the two ends of the range never cross
  const minOptions = PRICE_STEPS.filter((p) => !priceMax || p < Number(priceMax)).map(priceOption);
  const maxOptions = PRICE_STEPS.filter((p) => !priceMin || p > Number(priceMin)).map(priceOption);

  return (
    <div className="card rounded-2xl p-4 shadow-lift sm:p-5">
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-3 lg:grid-cols-[1.1fr_1fr_1.35fr_1fr_auto] lg:items-end"
      >
        <label className="block">
          <span className={label}>{t("home.searchBrand")}</span>
          <Select
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
            className="input"
          />
        </label>

        <div className="col-span-2 lg:col-span-1">
          <span className={label}>{t("home.searchPrice")}</span>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={priceMin}
              onChange={setPriceMin}
              placeholder={t("home.priceFrom")}
              options={minOptions}
            />
            <Select
              value={priceMax}
              onChange={setPriceMax}
              placeholder={t("home.priceTo")}
              options={maxOptions}
            />
          </div>
        </div>

        <label className="col-span-2 block lg:col-span-1">
          <span className={label}>{t("home.searchFuel")}</span>
          <Select
            value={fuel}
            onChange={setFuel}
            placeholder={t("home.searchAny")}
            options={FUELS.map((f) => ({ value: f, label: t(`options.fuel.${f}`) }))}
          />
        </label>

        <button
          type="submit"
          className="btn-primary col-span-2 h-11 whitespace-nowrap px-5 lg:col-span-1"
        >
          {t("home.showCars", { count })}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </form>

      {/* quick chips: one scrolling row on phones (edge to edge), wrapping from sm */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5 border-t border-line pt-3.5">
        <div className="scroll-row -mx-4 w-[calc(100%+2rem)] items-center px-4 sm:mx-0 sm:w-auto sm:flex-1 sm:flex-wrap sm:overflow-visible sm:px-0">
          <span className="shrink-0 text-xs font-semibold text-ink-faint">{t("home.quickFilters")}</span>
          {quick.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="chip-3d shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              {q.label}
            </Link>
          ))}
        </div>
        <Link href="/auto" className="link-more ml-auto shrink-0 text-[13px]">
          <SlidersIcon className="h-3.5 w-3.5" />
          {t("home.advanced")}
        </Link>
      </div>
    </div>
  );
}
