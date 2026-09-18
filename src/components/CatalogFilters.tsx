"use client";

// Catalog filters — vertical sidebar (desktop) / collapsible panel (mobile).
// Every criterion from the big local sites, grouped so the common ones come
// first and the rest sit behind "more filters".
// Filters apply by themselves: selects the moment they change, typed fields
// shortly after the last keystroke — there is no "apply" button to hunt for.
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Select } from "./ui/Select";
import { SearchIcon } from "./icons";
import {
  BODIES,
  MINIBUS,
  MINIBUS_BODIES,
  DRIVETRAINS,
  FUELS,
  TRANSMISSIONS,
  type CarFilters,
} from "@/lib/cars";

const SEATS = [2, 4, 5, 6, 7, 8, 9];
const TYPING_DELAY = 450;

type Values = Record<string, string>;

const str = (v: string | number | undefined | null) =>
  v === undefined || v === null ? "" : String(v);

function fromFilters(f: CarFilters): Values {
  return {
    q: str(f.q),
    brand: str(f.brand),
    model: str(f.model),
    priceMin: str(f.priceMin),
    priceMax: str(f.priceMax),
    yearMin: str(f.yearMin),
    yearMax: str(f.yearMax),
    body: str(f.body),
    fuel: str(f.fuel),
    transmission: str(f.transmission),
    drivetrain: str(f.drivetrain),
    mileageMin: str(f.mileageMin),
    mileageMax: str(f.mileageMax),
    engineMin: str(f.engineMin),
    engineMax: str(f.engineMax),
    color: str(f.color),
    seats: str(f.seats),
  };
}

export function CatalogFilters({
  action,
  brands,
  colors,
  filters,
  total,
}: {
  action: string;
  brands: { brand: string; count: number }[];
  colors: string[];
  filters: CarFilters;
  total: number;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const incoming = fromFilters(filters);
  const [values, setValues] = useState<Values>(incoming);
  // follow the URL when it changes from outside (brand chips, nav categories…)
  const [seen, setSeen] = useState(JSON.stringify(incoming));
  if (seen !== JSON.stringify(incoming)) {
    setSeen(JSON.stringify(incoming));
    setValues(incoming);
  }

  const typing = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(typing.current), []);

  function commit(next: Values) {
    window.clearTimeout(typing.current);
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      const value = v.trim();
      if (value !== "") q.set(k, value);
    }
    // the order is kept; the list always restarts at page 1 after a change
    if (filters.sort && filters.sort !== "new") q.set("sort", filters.sort);
    startTransition(() =>
      router.replace(`/auto${q.size ? `?${q}` : ""}`, { scroll: false })
    );
  }

  /** selects: apply straight away */
  const pick = (name: string) => (v: string) => {
    const next = { ...values, [name]: v };
    setValues(next);
    commit(next);
  };

  /** typed fields: apply once the typing stops */
  const type = (name: string) => (v: string) => {
    const next = { ...values, [name]: v };
    setValues(next);
    window.clearTimeout(typing.current);
    typing.current = window.setTimeout(() => commit(next), TYPING_DELAY);
  };

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

  // the two minibus bodies are sold as one category, so they filter as one
  const bodyOptions = [
    ...BODIES.filter(
      (b) => !(MINIBUS_BODIES as readonly string[]).includes(b)
    ).map((b) => ({ value: b, label: t(`options.body.${b}`) })),
    { value: MINIBUS, label: t("options.body.minibus") },
  ];

  const selectField = (
    label: string,
    name: string,
    options: { value: string; label: string }[],
    searchable = false
  ) => (
    <div className="block">
      <span className="field-label">{label}</span>
      <Select
        name={name}
        searchable={searchable}
        value={values[name] ?? ""}
        onChange={pick(name)}
        placeholder={t("home.searchAny")}
        options={options}
      />
    </div>
  );

  const numberField = (name: string, placeholder?: string) => (
    <label className="block min-w-0">
      <input
        type="number"
        name={name}
        value={values[name] ?? ""}
        onChange={(e) => type(name)(e.target.value)}
        placeholder={placeholder}
        min={0}
        inputMode="numeric"
        className="input h-10"
      />
    </label>
  );

  const range = (
    label: string,
    minName: string,
    maxName: string,
    minPh?: string,
    maxPh?: string
  ) => (
    <div>
      <span className="field-label">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {numberField(minName, minPh)}
        {numberField(maxName, maxPh)}
      </div>
    </div>
  );

  const dirty = Object.values(values).some((v) => v.trim() !== "");

  return (
    <form
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        commit(values);
      }}
      className={`space-y-4 transition-opacity ${pending ? "opacity-60" : ""}`}
    >
      <label className="relative block">
        <span className="field-label">{t("catalog.search")}</span>
        <SearchIcon className="pointer-events-none absolute bottom-3 left-3.5 h-4 w-4 text-ink-faint" />
        <input
          name="q"
          value={values.q}
          onChange={(e) => type("q")(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="input pl-10"
        />
      </label>

      {selectField(
        t("home.searchBrand"),
        "brand",
        brands.map((b) => ({ value: b.brand, label: `${b.brand} (${b.count})` })),
        true
      )}
      <label className="block">
        <span className="field-label">{t("home.searchModel")}</span>
        <input
          name="model"
          value={values.model}
          onChange={(e) => type("model")(e.target.value)}
          className="input"
        />
      </label>

      {range(`${t("common.price")} (€)`, "priceMin", "priceMax", "0", "50 000")}
      {range(
        t("common.year"),
        "yearMin",
        "yearMax",
        "2000",
        String(new Date().getFullYear())
      )}

      {selectField(t("common.body"), "body", bodyOptions)}
      {selectField(t("common.fuel"), "fuel", opts(FUELS, "fuel"))}
      {selectField(
        t("common.transmission"),
        "transmission",
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
          opts(DRIVETRAINS, "drivetrain")
        )}
        {range(t("common.mileage"), "mileageMin", "mileageMax", "0", "200 000")}
        {range(
          `${t("common.engine")} (cm³)`,
          "engineMin",
          "engineMax",
          "1000",
          "5000"
        )}
        {selectField(
          t("common.color"),
          "color",
          colors.map((c) => ({ value: c, label: c }))
        )}
        {selectField(
          t("common.seats"),
          "seats",
          SEATS.map((n) => ({ value: String(n), label: String(n) }))
        )}
      </div>

      {filters.sort && filters.sort !== "new" && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}

      <div className="flex flex-col gap-2 pt-1">
        {/* phones: the open panel hides the list, so offer a way back to it */}
        <button
          type="button"
          onClick={(e) =>
            e.currentTarget.closest("details")?.removeAttribute("open")
          }
          className="btn-primary h-11 w-full px-4 lg:hidden"
        >
          {t("catalog.showResults", { count: total })}
        </button>

        <div
          aria-live="polite"
          className="flex h-5 items-center justify-center gap-2 text-[12.5px] font-semibold text-ink-faint"
        >
          {pending && (
            <>
              <span className="filters-spinner" aria-hidden />
              {t("catalog.applying")}
            </>
          )}
        </div>

        {dirty && (
          <Link
            href="/auto"
            className="chip-3d flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold text-ink-soft"
          >
            {t("catalog.reset")}
          </Link>
        )}
      </div>
    </form>
  );
}
