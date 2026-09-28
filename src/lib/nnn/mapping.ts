// Dictionaries shared by the export (site → 999.md) and the import
// (999.md → site). 999.md describes cars through dynamic "features"; we match
// them by their RU titles and translate option titles to our canonical keys.

// Fixed ids from the Partners API docs (Transport / Легковые автомобили / Продам)
export const CATEGORY_ID = "658";
export const SUBCATEGORY_ID = "659";
export const OFFER_TYPE = "776";

export const norm = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

// RU synonyms for our canonical option keys (order matters: first = preferred)
export const FUEL_RU: Record<string, string[]> = {
  petrol: ["бензин"],
  diesel: ["дизель"],
  hybrid: ["гибрид", "мягкий гибрид", "гибрид (бензин)", "гибрид (дизель)"],
  phev: ["плагин-гибрид (бензин)", "плагин-гибрид (дизель)", "плагин-гибрид", "плагин гибрид", "phev"],
  electric: ["электричество", "электро"],
  gas: ["газ", "газ / бензин", "газ/бензин", "метан", "пропан"],
};

export const TRANSMISSION_RU: Record<string, string[]> = {
  automatic: ["автомат", "автоматическая"],
  manual: ["механика", "механическая"],
  robotic: ["робот"],
  cvt: ["вариатор"],
};

export const BODY_RU: Record<string, string[]> = {
  sedan: ["седан"],
  hatchback: ["хэтчбек", "хетчбек", "хетчбэк", "лифтбек"],
  wagon: ["универсал", "комби"],
  suv: ["внедорожник", "кроссовер", "джип"],
  coupe: ["купе"],
  cabrio: ["кабриолет", "родстер"],
  minivan: ["минивэн", "минивен", "микровэн"],
  van: ["фургон", "микроавтобус"],
  pickup: ["пикап"],
};

export const DRIVETRAIN_RU: Record<string, string[]> = {
  fwd: ["передний"],
  rwd: ["задний"],
  awd: ["полный", "4x4", "4х4"],
};

/** RU option title → canonical key ("Дизель" → "diesel"), or undefined */
export function keyFromRu(
  dict: Record<string, string[]>,
  title: string | undefined | null
): string | undefined {
  if (!title) return undefined;
  const t = norm(title);
  // exact match first (so "гибрид" doesn't win over "плагин-гибрид")
  for (const [key, syns] of Object.entries(dict)) {
    if (syns.some((s) => norm(s) === t)) return key;
  }
  // then the longest synonym contained in the title, so
  // "плагин-гибрид (бензин)" is phev, not petrol
  let best: { key: string; len: number } | undefined;
  for (const [key, syns] of Object.entries(dict)) {
    for (const s of syns) {
      const n = norm(s);
      if (t.includes(n) && (!best || n.length > best.len)) best = { key, len: n.length };
    }
  }
  if (best) return best.key;
  return undefined;
}

// Feature title keywords (RU) for each of our fields
export const FEATURE_KEYS = {
  brand: ["марка"],
  model: ["модель"],
  year: ["год выпуска", "год"],
  title: ["заголовок"],
  description: ["текст объявления", "описание"],
  price: ["цена"],
  mileage: ["пробег"],
  fuel: ["тип топлива", "топлив"],
  transmission: ["коробка передач", "кпп", "коробка"],
  body: ["тип кузова", "кузов"],
  drivetrain: ["привод"],
  engine: ["объем двигателя", "объём двигателя", "двигатель", "объем", "объём"],
  power: ["мощность"],
  color: ["цвет"],
  seats: ["количество мест", "мест"],
  vin: ["vin"],
  doors: ["количество дверей"],
} as const;

export type FeatureKey = keyof typeof FEATURE_KEYS;

// Colours: RU option title → RO label used on the site
export const COLOR_RU_RO: Record<string, string> = {
  белый: "Alb",
  черный: "Negru",
  серый: "Gri",
  серебристый: "Argintiu",
  синий: "Albastru",
  голубой: "Bleu",
  красный: "Roșu",
  зеленый: "Verde",
  желтый: "Galben",
  оранжевый: "Portocaliu",
  коричневый: "Maro",
  бежевый: "Bej",
  бордовый: "Bordo",
  фиолетовый: "Violet",
  золотистый: "Auriu",
  другой: "Altă",
};

export function colorFromRu(title: string | undefined | null) {
  if (!title) return undefined;
  const t = norm(title);
  return COLOR_RU_RO[t] ?? title;
}

/** convert an engine volume to cm³ regardless of the unit 999.md reports */
export function engineToCc(value: number, unit?: string) {
  if (!Number.isFinite(value)) return undefined;
  const u = (unit ?? "").toLowerCase();
  if (u === "l" || (value < 20 && !u.includes("cm"))) return Math.round(value * 1000);
  return Math.round(value);
}

/** convert power to hp regardless of the unit */
export function powerToHp(value: number, unit?: string) {
  if (!Number.isFinite(value)) return undefined;
  const u = (unit ?? "").toLowerCase();
  if (u === "kw") return Math.round(value * 1.341);
  return Math.round(value);
}

/** RU-heavy text? (used to decide whether an advert body is the RU description) */
export function looksRussian(text: string) {
  const cyr = (text.match(/[а-яё]/gi) ?? []).length;
  const lat = (text.match(/[a-zăâîșț]/gi) ?? []).length;
  return cyr > lat;
}

// Advert details beyond the core specs, read by feature id (the ids are fixed
// on 999.md; RU option titles → our canonical keys, translated on display)
export const EXTRA_FEATURES = {
  registration: {
    id: "775",
    dict: {
      md: ["республика молдова"],
      cleared: ["растаможен"],
      not_cleared: ["не растаможен"],
      transnistria: ["приднестровье"],
      other: ["другое"],
    },
  },
  condition: {
    id: "593",
    dict: { new: ["новый"], used: ["с пробегом"], needs_repair: ["требует ремонта"] },
  },
  availability: {
    id: "1761",
    dict: { in_stock: ["на месте"], in_transit: ["в пути"], on_order: ["под заказ"] },
  },
  origin: {
    id: "1763",
    dict: {
      eu: ["еврозона"],
      usa: ["сша"],
      korea: ["корея"],
      japan: ["япония"],
      china: ["китай"],
      other: ["другое"],
    },
  },
  steering: { id: "1196", dict: { left: ["левый"], right: ["правый"] } },
} as const satisfies Record<string, { id: string; dict: Record<string, string[]> }>;

export type ExtraKey = keyof typeof EXTRA_FEATURES;
export const EXTRA_KEYS = Object.keys(EXTRA_FEATURES) as ExtraKey[];

export const DOORS_FEATURE_ID = "851";
export const RANGE_FEATURE_ID = "2513";
export const OLD_PRICE_FEATURE_ID = "1640";

/** exact RU option title → key (these lists are closed, no fuzzy matching) */
export function extraKeyFromRu(key: ExtraKey, title: string | undefined | null) {
  if (!title) return undefined;
  const t = norm(title);
  for (const [k, syns] of Object.entries(EXTRA_FEATURES[key].dict))
    if ((syns as readonly string[]).includes(t)) return k;
  return undefined;
}
