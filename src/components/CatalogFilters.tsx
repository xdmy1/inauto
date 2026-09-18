"use client";

// Catalog filters — vertical sidebar (desktop) / collapsible panel (mobile).
// Every criterion from the big local sites, grouped so the common ones come
// first and the rest sit behind "more filters".
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Select } from "./ui/Select";
import { SearchIcon } from "./icons";
import {
  BODIES,
  DRIVETRAINS,
  FUELS,
  TRANSMISSIONS,
  type CarFilters,
} from "@/lib/cars";

const SEATS = [2, 4, 5, 6, 7, 8, 9];

function NumberField({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label?: string;
  defaultValue?: number;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      {label && <span className="field-label">{label}</span>}
      <input
        type="number"
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        min={0}
        inputMode="numeric"
        className="input h-10"
      />
    </label>
  );
}

function Range({
  label,
  minName,
  maxName,
  min,
  max,
  minPh,
  maxPh,
}: {
  label: string;
  minName: string;
  maxName: string;
  min?: number;
  max?: number;
  minPh?: string;
  maxPh?: string;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <NumberField name={minName} defaultValue={min} placeholder={minPh} />
        <NumberField name={maxName} defaultValue={max} placeholder={maxPh} />
      </div>
    </div>
  );
}

export function CatalogFilters({
  action,
  brands,
  colors,
  filters,
}: {
  action: string;
  brands: { brand: string; count: number }[];
  colors: string[];
  filters: CarFilters;
}) {
  const t = useTranslations();
  const [brand, setBrand] = useState(filters.brand ?? "");
  const [body, setBody] = useState(filters.body ?? "");
  const [fuel, setFuel] = useState(filters.fuel ?? "");
  const [transmission, setTransmission] = useState(filters.transmission ?? "");
  const [drivetrain, setDrivetrain] = useState(filters.drivetrain ?? "");
  const [color, setColor] = useState(filters.color ?? "");
  const [seats, setSeats] = useState(filters.seats ? String(filters.seats) : "");
  const advancedUsed = !!(
    filters.color ||
    filters.seats ||
    filters.mileageMin ||
    filters.mileageMax ||
    filters.engineMin ||
    filters.engineMax ||
    filters.drivetrain
  );
  const [more, setMore] = useState(advancedUsed);

  const opts = (
    keys: readonly string[],
    ns: "body" | "fuel" | "transmission" | "drivetrain"
  ) => keys.map((k) => ({ value: k, label: t(`options.${ns}.${k}`) }));

  const selectField = (
    label: string,
    name: string,
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[],
    searchable = false
  ) => (
    <div className="block">
      <span className="field-label">{label}</span>
      <Select
        name={name}
        searchable={searchable}
        value={value}
        onChange={onChange}
        placeholder={t("home.searchAny")}
        options={options}
      />
    </div>
  );

  return (
    <form action={action} className="space-y-4">
      <label className="relative block">
        <span className="field-label">{t("catalog.search")}</span>
        <SearchIcon className="pointer-events-none absolute bottom-3 left-3.5 h-4 w-4 text-ink-faint" />
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder={t("catalog.searchPlaceholder")}
          className="input pl-10"
        />
      </label>

      {selectField(
        t("home.searchBrand"),
        "brand",
        brand,
        setBrand,
        brands.map((b) => ({ value: b.brand, label: `${b.brand} (${b.count})` })),
        true
      )}
      <label className="block">
        <span className="field-label">{t("home.searchModel")}</span>
        <input name="model" defaultValue={filters.model ?? ""} className="input" />
      </label>

      <Range
        label={`${t("common.price")} (€)`}
        minName="priceMin"
        maxName="priceMax"
        min={filters.priceMin}
        max={filters.priceMax}
        minPh="0"
        maxPh="50 000"
      />
      <Range
        label={t("common.year")}
        minName="yearMin"
        maxName="yearMax"
        min={filters.yearMin}
        max={filters.yearMax}
        minPh="2000"
        maxPh={String(new Date().getFullYear())}
      />

      {selectField(t("common.body"), "body", body, setBody, opts(BODIES, "body"))}
      {selectField(t("common.fuel"), "fuel", fuel, setFuel, opts(FUELS, "fuel"))}
      {selectField(
        t("common.transmission"),
        "transmission",
        transmission,
        setTransmission,
        opts(TRANSMISSIONS, "transmission")
      )}

      <button
        type="button"
        onClick={() => setMore((m) => !m)}
        aria-expanded={more}
        className="flex w-full items-center justify-between rounded-lg border border-dashed border-line px-3 py-2 text-left text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
      >
        {more ? t("catalog.less") : t("catalog.more")}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-transform ${more ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className={`space-y-4 ${more ? "" : "hidden"}`}>
        {selectField(
          t("common.drivetrain"),
          "drivetrain",
          drivetrain,
          setDrivetrain,
          opts(DRIVETRAINS, "drivetrain")
        )}
        <Range
          label={t("common.mileage")}
          minName="mileageMin"
          maxName="mileageMax"
          min={filters.mileageMin}
          max={filters.mileageMax}
          minPh="0"
          maxPh="200 000"
        />
        <Range
          label={`${t("common.engine")} (cm³)`}
          minName="engineMin"
          maxName="engineMax"
          min={filters.engineMin}
          max={filters.engineMax}
          minPh="1000"
          maxPh="5000"
        />
        {selectField(
          t("common.color"),
          "color",
          color,
          setColor,
          colors.map((c) => ({ value: c, label: c }))
        )}
        {selectField(
          t("common.seats"),
          "seats",
          seats,
          setSeats,
          SEATS.map((n) => ({ value: String(n), label: String(n) }))
        )}
      </div>

      {filters.sort && filters.sort !== "new" && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button type="submit" className="btn-primary h-11 w-full px-4">
          <SearchIcon className="h-4 w-4" />
          {t("catalog.apply")}
        </button>
        <Link
          href="/auto"
          className="chip-3d flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold text-ink-soft"
        >
          {t("catalog.reset")}
        </Link>
      </div>
    </form>
  );
}
