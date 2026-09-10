"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Select } from "./ui/Select";
import {
  BODIES,
  DRIVETRAINS,
  FUELS,
  TRANSMISSIONS,
  type CarFilters,
} from "@/lib/cars";

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

const SEATS = [2, 4, 5, 6, 7, 8, 9];

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

  return (
    <form action={action} className="space-y-3.5">
      <div className="block">
        <span className="field-label">{t("home.searchBrand")}</span>
        <Select
          name="brand"
          searchable
          value={brand}
          onChange={setBrand}
          options={brands.map((b) => ({
            value: b.brand,
            label: `${b.brand} (${b.count})`,
          }))}
        />
      </div>

      <label className="block">
        <span className="field-label">{t("home.searchModel")}</span>
        <input
          name="model"
          defaultValue={filters.model ?? ""}
          className="input"
        />
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        <NumberField name="priceMin" label={t("catalog.priceMin")} defaultValue={filters.priceMin} placeholder="0 €" />
        <NumberField name="priceMax" label={t("catalog.priceMax")} defaultValue={filters.priceMax} placeholder="∞ €" />
        <NumberField name="yearMin" label={t("catalog.yearMin")} defaultValue={filters.yearMin} placeholder="2000" />
        <NumberField name="yearMax" label={t("catalog.yearMax")} defaultValue={filters.yearMax} placeholder="2026" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <NumberField
          name="mileageMin"
          label={`${t("common.mileage")} min`}
          defaultValue={filters.mileageMin}
          placeholder="0 km"
        />
        <NumberField
          name="mileageMax"
          label={t("catalog.mileageMax")}
          defaultValue={filters.mileageMax}
          placeholder="200 000 km"
        />
        <NumberField
          name="engineMin"
          label={`${t("common.engine")} min`}
          defaultValue={filters.engineMin}
          placeholder="1000 cm³"
        />
        <NumberField
          name="engineMax"
          label={`${t("common.engine")} max`}
          defaultValue={filters.engineMax}
          placeholder="5000 cm³"
        />
      </div>

      <div className="block">
        <span className="field-label">{t("common.body")}</span>
        <Select name="body" value={body} onChange={setBody} options={opts(BODIES, "body")} />
      </div>
      <div className="block">
        <span className="field-label">{t("common.fuel")}</span>
        <Select name="fuel" value={fuel} onChange={setFuel} options={opts(FUELS, "fuel")} />
      </div>
      <div className="block">
        <span className="field-label">{t("common.transmission")}</span>
        <Select
          name="transmission"
          value={transmission}
          onChange={setTransmission}
          options={opts(TRANSMISSIONS, "transmission")}
        />
      </div>
      <div className="block">
        <span className="field-label">{t("common.drivetrain")}</span>
        <Select
          name="drivetrain"
          value={drivetrain}
          onChange={setDrivetrain}
          options={opts(DRIVETRAINS, "drivetrain")}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="block">
          <span className="field-label">{t("common.color")}</span>
          <Select
            name="color"
            value={color}
            onChange={setColor}
            options={colors.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="block">
          <span className="field-label">{t("common.seats")}</span>
          <Select
            name="seats"
            value={seats}
            onChange={setSeats}
            options={SEATS.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
      </div>

      {filters.sort && filters.sort !== "new" && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-dark h-11 flex-1 px-0 text-sm">
          {t("catalog.apply")}
        </button>
        <Link
          href="/auto"
          className="flex h-11 items-center rounded-xl border border-line bg-card px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {t("catalog.reset")}
        </Link>
      </div>
    </form>
  );
}
