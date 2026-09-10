"use client";

// Horizontal filter bar for /auto — every criterion visible, full width
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
  label: string;
  defaultValue?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        min={0}
        className="input"
      />
    </label>
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
        options={options}
      />
    </div>
  );

  return (
    <form
      action={action}
      className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      {selectField(
        t("home.searchBrand"),
        "brand",
        brand,
        setBrand,
        brands.map((b) => ({
          value: b.brand,
          label: `${b.brand} (${b.count})`,
        })),
        true
      )}
      <label className="block">
        <span className="field-label">{t("home.searchModel")}</span>
        <input
          name="model"
          defaultValue={filters.model ?? ""}
          className="input"
        />
      </label>
      <NumberField name="priceMin" label={t("catalog.priceMin")} defaultValue={filters.priceMin} placeholder="0" />
      <NumberField name="priceMax" label={t("catalog.priceMax")} defaultValue={filters.priceMax} placeholder="∞" />
      <NumberField name="yearMin" label={t("catalog.yearMin")} defaultValue={filters.yearMin} placeholder="2000" />
      <NumberField name="yearMax" label={t("catalog.yearMax")} defaultValue={filters.yearMax} placeholder="2026" />

      {selectField(t("common.body"), "body", body, setBody, opts(BODIES, "body"))}
      {selectField(t("common.fuel"), "fuel", fuel, setFuel, opts(FUELS, "fuel"))}
      {selectField(
        t("common.transmission"),
        "transmission",
        transmission,
        setTransmission,
        opts(TRANSMISSIONS, "transmission")
      )}
      {selectField(
        t("common.drivetrain"),
        "drivetrain",
        drivetrain,
        setDrivetrain,
        opts(DRIVETRAINS, "drivetrain")
      )}
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

      <NumberField
        name="mileageMin"
        label={`${t("common.mileage")} min`}
        defaultValue={filters.mileageMin}
        placeholder="0"
      />
      <NumberField
        name="mileageMax"
        label={`${t("common.mileage")} max`}
        defaultValue={filters.mileageMax}
        placeholder="200 000"
      />
      <NumberField
        name="engineMin"
        label={`${t("common.engine")} min`}
        defaultValue={filters.engineMin}
        placeholder="1000"
      />
      <NumberField
        name="engineMax"
        label={`${t("common.engine")} max`}
        defaultValue={filters.engineMax}
        placeholder="5000"
      />

      {filters.sort && filters.sort !== "new" && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}

      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-2">
        <button type="submit" className="btn-primary h-11 flex-1 px-4">
          <SearchIcon className="h-4 w-4" />
          {t("catalog.apply")}
        </button>
        <Link
          href="/auto"
          className="chip-3d flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-ink-soft"
        >
          {t("catalog.reset")}
        </Link>
      </div>
    </form>
  );
}
