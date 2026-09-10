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
const nf = new Intl.NumberFormat("ro-RO");

/** editable value that looks like text — formatted at rest, raw while editing */
function NumValue({
  value,
  onCommit,
  plain = false,
}: {
  value: number;
  onCommit: (n: number) => void;
  plain?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [txt, setTxt] = useState("");
  const shown = editing ? txt : plain ? String(value) : nf.format(value);
  return (
    <input
      inputMode="numeric"
      value={shown}
      onFocus={(e) => {
        setEditing(true);
        setTxt(String(value));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const n = Number(txt.replace(/[^\d]/g, ""));
        if (Number.isFinite(n) && txt.trim() !== "" && n !== value) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="min-w-0 border-b border-dashed border-transparent bg-transparent p-0 text-right font-semibold tabular-nums text-white outline-none transition-colors hover:border-white/30 focus:border-white/60"
      style={{ width: `${shown.length + 0.5}ch` }}
    />
  );
}

/** one self-contained range control: label, editable values, slider */
function RangePanel({
  label,
  min,
  max,
  step,
  value,
  onChange,
  plain,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  plain?: boolean;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 pb-3.5 pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-white/55">{label}</span>
        <span className="flex items-baseline gap-1 text-[13.5px]">
          <NumValue
            plain={plain}
            value={value[0]}
            onCommit={(n) =>
              onChange([Math.min(clamp(n), value[1] - step), value[1]])
            }
          />
          <span className="text-white/35">–</span>
          <NumValue
            plain={plain}
            value={value[1]}
            onCommit={(n) =>
              onChange([value[0], Math.max(clamp(n), value[0] + step)])
            }
          />
        </span>
      </div>
      <div className="mt-2.5 px-1">
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

  const label = "text-xs font-medium text-white/55";

  const selectField = (
    lbl: string,
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[],
    searchable = false
  ) => (
    <label className="block" key={lbl}>
      <span className={`${label} mb-1.5 block`}>{lbl}</span>
      <Select
        variant="dark"
        searchable={searchable}
        value={value}
        onChange={onChange}
        placeholder={t("home.searchAny")}
        options={options}
      />
    </label>
  );

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col gap-3.5 rounded-2xl bg-ink p-5 text-white sm:p-6"
    >
      <h2 className="font-display text-lg font-bold">{t("home.searchTitle")}</h2>

      <div className="grid grid-cols-2 gap-3">
        {selectField(
          t("home.searchBrand"),
          brand,
          setBrand,
          brands.map((b) => ({
            value: b.brand,
            label: `${b.brand} (${b.count})`,
          })),
          true
        )}
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

      <RangePanel
        label={`${t("common.price")} (€)`}
        min={bounds.priceMin}
        max={bounds.priceMax}
        step={500}
        value={price}
        onChange={setPrice}
      />
      <RangePanel
        plain
        label={t("common.year")}
        min={bounds.yearMin}
        max={bounds.yearMax}
        step={1}
        value={year}
        onChange={setYear}
      />

      <div className="grid grid-cols-2 gap-3">
        {selectField(
          t("home.searchFuel"),
          fuel,
          setFuel,
          FUELS.map((f) => ({ value: f, label: t(`options.fuel.${f}`) }))
        )}
        {selectField(
          t("common.body"),
          body,
          setBody,
          BODIES.map((b) => ({ value: b, label: t(`options.body.${b}`) }))
        )}
      </div>

      {/* advanced filters — collapsed so the cars stay above the fold */}
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
          adv ? "grid-rows-[1fr]" : "-mt-3.5 grid-rows-[0fr]"
        }`}
      >
        <div className="flex min-h-0 flex-col gap-3.5 overflow-hidden px-0.5 pb-0.5 pt-0.5">
          <RangePanel
            label={`${t("common.mileage")} (km)`}
            min={0}
            max={bounds.mileageMax}
            step={5000}
            value={mileage}
            onChange={setMileage}
          />
          <RangePanel
            label={`${t("common.engine")} (cm³)`}
            min={bounds.engineMin}
            max={bounds.engineMax}
            step={100}
            value={engine}
            onChange={setEngine}
          />

          <div className="grid grid-cols-2 gap-3">
            {selectField(
              t("common.transmission"),
              transmission,
              setTransmission,
              TRANSMISSIONS.map((x) => ({
                value: x,
                label: t(`options.transmission.${x}`),
              }))
            )}
            {selectField(
              t("common.drivetrain"),
              drivetrain,
              setDrivetrain,
              DRIVETRAINS.map((d) => ({
                value: d,
                label: t(`options.drivetrain.${d}`),
              }))
            )}
            {selectField(
              t("common.color"),
              color,
              setColor,
              colors.map((c) => ({ value: c, label: c }))
            )}
            {selectField(
              t("common.seats"),
              seats,
              setSeats,
              SEATS.map((n) => ({ value: String(n), label: String(n) }))
            )}
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
