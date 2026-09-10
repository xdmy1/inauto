"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowRightIcon } from "./icons";
import { Select } from "./ui/Select";
import { RangeSlider } from "./ui/RangeSlider";
import { BODIES, DRIVETRAINS, FUELS, TRANSMISSIONS } from "@/lib/cars";

export type SearchBounds = {
  priceMin: number;
  priceMax: number;
  yearMin: number;
  yearMax: number;
  mileageMax: number;
  engineMin: number;
  engineMax: number;
};

const SEATS = [2, 4, 5, 6, 7, 8, 9];

/** numeric box that commits on blur/Enter — type instead of dragging */
function NumBox({
  value,
  onCommit,
  suffix,
}: {
  value: number;
  onCommit: (n: number) => void;
  suffix?: string;
}) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => setTxt(String(value)), [value]);
  return (
    <span className="flex items-center gap-1">
      <input
        inputMode="numeric"
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => {
          const n = Number(txt.replace(/[^\d]/g, ""));
          if (Number.isFinite(n) && txt.trim() !== "") onCommit(n);
          else setTxt(String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="h-8 w-[72px] rounded-md border border-white/15 bg-white/[0.07] px-2 text-right text-[13px] tabular-nums text-white outline-none transition-colors focus:border-white/50"
      />
      {suffix && <span className="text-[11px] text-white/45">{suffix}</span>}
    </span>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-white/60">{label}</span>
        <span className="flex items-center gap-1.5">
          <NumBox
            value={value[0]}
            suffix={suffix}
            onCommit={(n) =>
              onChange([Math.min(clamp(n), value[1] - step), value[1]])
            }
          />
          <span className="text-white/35">–</span>
          <NumBox
            value={value[1]}
            suffix={suffix}
            onCommit={(n) =>
              onChange([value[0], Math.max(clamp(n), value[0] + step)])
            }
          />
        </span>
      </div>
      <div className="mt-2 px-1">
        <RangeSlider
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export function QuickSearch({
  brands,
  colors,
  count: initialCount,
  bounds,
}: {
  brands: { brand: string; count: number }[];
  colors: string[];
  count: number;
  bounds: SearchBounds;
}) {
  const t = useTranslations();
  const router = useRouter();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [body, setBody] = useState("");
  const [fuel, setFuel] = useState("");
  const [transmission, setTransmission] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState<[number, number]>([
    bounds.priceMin,
    bounds.priceMax,
  ]);
  const [year, setYear] = useState<[number, number]>([
    bounds.yearMin,
    bounds.yearMax,
  ]);
  const [mileage, setMileage] = useState<[number, number]>([
    0,
    bounds.mileageMax,
  ]);
  const [engine, setEngine] = useState<[number, number]>([
    bounds.engineMin,
    bounds.engineMax,
  ]);

  const [adv, setAdv] = useState(false);
  const [count, setCount] = useState(initialCount);
  const debounce = useRef<number | undefined>(undefined);

  function buildParams() {
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (model) p.set("model", model);
    if (body) p.set("body", body);
    if (fuel) p.set("fuel", fuel);
    if (transmission) p.set("transmission", transmission);
    if (drivetrain) p.set("drivetrain", drivetrain);
    if (color) p.set("color", color);
    if (seats) p.set("seats", seats);
    if (price[0] > bounds.priceMin) p.set("priceMin", String(price[0]));
    if (price[1] < bounds.priceMax) p.set("priceMax", String(price[1]));
    if (year[0] > bounds.yearMin) p.set("yearMin", String(year[0]));
    if (year[1] < bounds.yearMax) p.set("yearMax", String(year[1]));
    if (mileage[0] > 0) p.set("mileageMin", String(mileage[0]));
    if (mileage[1] < bounds.mileageMax) p.set("mileageMax", String(mileage[1]));
    if (engine[0] > bounds.engineMin) p.set("engineMin", String(engine[0]));
    if (engine[1] < bounds.engineMax) p.set("engineMax", String(engine[1]));
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
  }, [brand, model, body, fuel, transmission, drivetrain, color, seats, price, year, mileage, engine]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = buildParams();
    router.push(`/auto${p.size ? `?${p}` : ""}`);
  }

  const label = "text-xs font-medium text-white/60";
  const chip = (active: boolean) =>
    `cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
      active
        ? "tag-red"
        : "border border-white/15 bg-white/[0.06] text-white/75 hover:border-white/35 hover:text-white"
    }`;

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col gap-4 rounded-2xl bg-ink p-5 text-white sm:p-6"
    >
      <h2 className="font-display text-lg font-bold">{t("home.searchTitle")}</h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={`${label} mb-1.5 block`}>{t("home.searchBrand")}</span>
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
          <span className={`${label} mb-1.5 block`}>{t("home.searchModel")}</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("home.searchAny")}
            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.07] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50"
          />
        </label>
      </div>

      <RangeField
        label={t("common.price")}
        min={bounds.priceMin}
        max={bounds.priceMax}
        step={500}
        value={price}
        onChange={setPrice}
        suffix="€"
      />
      <RangeField
        label={t("common.year")}
        min={bounds.yearMin}
        max={bounds.yearMax}
        step={1}
        value={year}
        onChange={setYear}
      />
      <div>
        <span className={`${label} mb-2 block`}>{t("home.searchFuel")}</span>
        <div className="flex flex-wrap gap-1.5">
          {FUELS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={fuel === f}
              onClick={() => setFuel(fuel === f ? "" : f)}
              className={chip(fuel === f)}
            >
              {t(`options.fuel.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* advanced filters — collapsed by default so the cars stay above the fold */}
      <button
        type="button"
        onClick={() => setAdv(!adv)}
        aria-expanded={adv}
        className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
      >
        {t("home.advanced")}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${adv ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          adv ? "grid-rows-[1fr]" : "-mt-4 grid-rows-[0fr]"
        }`}
      >
        <div className="flex flex-col gap-4 overflow-hidden px-0.5 pb-0.5">
      <RangeField
        label={t("common.mileage")}
        min={0}
        max={bounds.mileageMax}
        step={5000}
        value={mileage}
        onChange={setMileage}
        suffix="km"
      />
      <RangeField
        label={`${t("common.engine")} (cm³)`}
        min={bounds.engineMin}
        max={bounds.engineMax}
        step={100}
        value={engine}
        onChange={setEngine}
      />

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="col-span-2">
          <span className={`${label} mb-2 block`}>{t("common.transmission")}</span>
          <div className="flex flex-wrap gap-1.5">
            {TRANSMISSIONS.map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={transmission === x}
                onClick={() => setTransmission(transmission === x ? "" : x)}
                className={chip(transmission === x)}
              >
                {t(`options.transmission.${x}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <span className={`${label} mb-2 block`}>{t("common.drivetrain")}</span>
          <div className="flex flex-wrap gap-1.5">
            {DRIVETRAINS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={drivetrain === d}
                onClick={() => setDrivetrain(drivetrain === d ? "" : d)}
                className={chip(drivetrain === d)}
              >
                {t(`options.drivetrain.${d}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className={`${label} mb-1.5 block`}>{t("common.body")}</span>
          <Select
            variant="dark"
            value={body}
            onChange={setBody}
            placeholder={t("home.searchAny")}
            options={BODIES.map((b) => ({
              value: b,
              label: t(`options.body.${b}`),
            }))}
          />
        </label>

        <label className="block">
          <span className={`${label} mb-1.5 block`}>{t("common.color")}</span>
          <Select
            variant="dark"
            value={color}
            onChange={setColor}
            placeholder={t("home.searchAny")}
            options={colors.map((c) => ({ value: c, label: c }))}
          />
        </label>

        <label className="block">
          <span className={`${label} mb-1.5 block`}>{t("common.seats")}</span>
          <Select
            variant="dark"
            value={seats}
            onChange={setSeats}
            placeholder={t("home.searchAny")}
            options={SEATS.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </label>
      </div>
        </div>
      </div>

      <button type="submit" className="btn-primary mt-auto w-full">
        {t("home.showCars", { count })}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
