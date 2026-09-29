"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { FUELS } from "@/lib/cars";
import { ArrowRightIcon, SlidersIcon } from "./icons";
import { Select } from "./ui/Select";
import { track } from "@/lib/analytics";

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
    track("search", {
      search_term: [brand, model, fuel, priceMin && `>${priceMin}`, priceMax && `<${priceMax}`].filter(Boolean).join(" ") || "(toate)",
      area: "hero_search",
      brand,
      model,
      fuel,
      price_min: Number(priceMin) || undefined,
      price_max: Number(priceMax) || undefined,
      results: count,
    });
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

  const priceOption = (p: number) => ({ value: String(p), label: `${nf.format(p)} €` });
  // the two ends of the range never cross
  const minOptions = PRICE_STEPS.filter((p) => !priceMax || p < Number(priceMax)).map(priceOption);
  const maxOptions = PRICE_STEPS.filter((p) => !priceMin || p > Number(priceMin)).map(priceOption);

  // a hairline between cells on desktop
  const sep = <span aria-hidden className="qs-sep" />;

  return (
    <div className="qs">
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-2 p-2 lg:flex lg:items-center lg:gap-0"
      >
        <div className="min-w-0 lg:flex-[1.15]">
          <Select
            variant="field"
            label={t("home.searchBrand")}
            searchable
            value={brand}
            onChange={setBrand}
            placeholder={t("home.searchAny")}
            options={brands.map((b) => ({
              value: b.brand,
              label: `${b.brand} (${b.count})`,
            }))}
          />
        </div>
        {sep}
        <label className="qs-cell flex h-[60px] min-w-0 cursor-text flex-col justify-center px-4 lg:flex-1">
          <span className="qs-label">{t("home.searchModel")}</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("home.searchAny")}
            className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-soft"
          />
        </label>
        {sep}
        <div className="qs-cell col-span-2 flex h-[60px] min-w-0 flex-col justify-center px-4 lg:flex-[1.45]">
          <span className="qs-label">{t("home.searchPrice")}</span>
          <div className="flex items-center gap-2">
            <Select
              variant="inline"
              className="min-w-0 flex-1"
              value={priceMin}
              onChange={setPriceMin}
              placeholder={t("home.priceFrom")}
              options={minOptions}
            />
            <span aria-hidden className="text-ink-faint">–</span>
            <Select
              variant="inline"
              className="min-w-0 flex-1"
              value={priceMax}
              onChange={setPriceMax}
              placeholder={t("home.priceTo")}
              options={maxOptions}
            />
          </div>
        </div>
        {sep}
        <div className="col-span-2 min-w-0 lg:flex-1">
          <Select
            variant="field"
            label={t("home.searchFuel")}
            value={fuel}
            onChange={setFuel}
            placeholder={t("home.searchAny")}
            options={FUELS.map((f) => ({ value: f, label: t(`options.fuel.${f}`) }))}
          />
        </div>

        <button
          type="submit"
          className="btn-primary col-span-2 h-[60px] whitespace-nowrap rounded-2xl px-6 text-[15px] lg:ml-2"
        >
          {t("home.showCars", { count })}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </form>

      {/* popular searches on their own quiet strip: one scrolling row on phones, wrapping from sm */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-b-[22px] border-t border-line bg-paper/70 px-4 py-3 sm:px-5">
        <div className="scroll-row -mx-4 w-[calc(100%+2rem)] items-center px-4 sm:mx-0 sm:w-auto sm:flex-1 sm:flex-wrap sm:overflow-visible sm:px-0">
          <span className="shrink-0 text-xs font-semibold text-ink-faint">{t("home.quickFilters")}</span>
          {quick.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="shrink-0 whitespace-nowrap rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
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
