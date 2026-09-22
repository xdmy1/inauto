// Import: bring the company's 999.md adverts onto the site.
//
// Every public advert in Transport → Autoturisme / Microbuze și furgonete on
// the account becomes a published car here. Adverts that were born on 999.md
// are re-read on each run — 999.md stays the master for their specs, price,
// description and photos; admin-only fields (old price, down payment,
// featured, status, location) are never touched. Cars that were born on the
// site are left alone (the site is their master). Adverts that disappear or
// stop being public archive their car on the site.
//
// Photos are not copied: the site shows them straight from 999.md's CDN
// (i.simpalsmedia.com), the same way the catalogue was first filled.
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { uniqueCarSlug } from "../cars";
import { site } from "../site";
import {
  getAdvertFeatures,
  getFeatures,
  listAdverts,
  nnnConfigured,
  nnnImageUrl,
  type NnnAdvertFeature,
  type NnnAdvertListItem,
} from "./client";
import {
  BODY_RU,
  CATEGORY_ID,
  DRIVETRAIN_RU,
  FEATURE_KEYS,
  FUEL_RU,
  OFFER_TYPE,
  TRANSMISSION_RU,
  colorFromRu,
  engineToCc,
  keyFromRu,
  looksRussian,
  norm,
  powerToHp,
  type FeatureKey,
} from "./mapping";

const MAX_IMAGES = 20;
const ALL_STATES = "public,blocked,blocked_commercial,need_pay,hidden,expired";
// The cron route may run for 300 s; reading one advert takes ~0.5 s (the API
// is rate-limited), so a run reads what fits and leaves the rest for the next.
const READ_BUDGET_MS = 230_000;

// the 999.md subcategories that have a place on the site
const SUBCATEGORIES: Record<string, { bodyFallback: string }> = {
  "659": { bodyFallback: "sedan" }, // Autoturisme
  "660": { bodyFallback: "van" }, // Microbuze și furgonete
};

export type ImportReport = {
  ok: boolean;
  created: number;
  updated: number;
  archived: number;
  skipped: number;
  unchanged: number;
  warnings: string[];
  error?: string;
  runId?: string;
};

/** the car fields the importer owns (everything else is admin-only) */
export type MappedCar = {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  body: string;
  fuel: string;
  transmission: string;
  drivetrain?: string;
  engineCc?: number;
  powerHp?: number;
  color?: string;
  seats?: number;
  vin?: string;
  descriptionRo: string;
  descriptionRu: string;
  equipmentRo: string;
  equipmentRu: string;
  imageIds: string[];
};

// Priority order: specific titles first so "объем двигателя" isn't read as "год"
const FIELD_ORDER: FeatureKey[] = [
  "brand",
  "model",
  "year",
  "title",
  "description",
  "price",
  "mileage",
  "fuel",
  "transmission",
  "body",
  "drivetrain",
  "engine",
  "power",
  "color",
  "seats",
  "vin",
];

/** which of our fields a 999.md feature title (RU) stands for */
function fieldOf(title: string): { key: FeatureKey; exact: boolean } | undefined {
  const t = norm(title);
  for (const key of FIELD_ORDER) {
    const kws = FEATURE_KEYS[key] as readonly string[];
    if (kws.some((k) => t === norm(k))) return { key, exact: true };
  }
  for (const key of FIELD_ORDER) {
    const kws = FEATURE_KEYS[key] as readonly string[];
    if (kws.some((k) => t.includes(norm(k)))) return { key, exact: false };
  }
  return undefined;
}

const toNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

/** the chosen option's title, or the raw value for free-text features */
const optionTitle = (f: NnnAdvertFeature): string | undefined => {
  if (f.value == null) return undefined;
  const id = String(f.value);
  if (f.options) return f.options.find((o) => o.id === id)?.title;
  return typeof f.value === "string" ? f.value : id;
};

const isOn = (v: unknown) => v === true || v === "true" || v === 1 || v === "1" || v === "True";

// The dealer's adverts share one template: promo lines, then the car-specific
// part under "#### DESCRIERE SUPLIMENTARĂ ####", then payment options, links
// and the address. Only the car-specific part belongs on the site.
export function cleanDescription(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  const isMarker = (l: string) => /^\s*#{3,}/.test(l);
  const start = lines.findIndex((l) => isMarker(l) && /suplimentar|дополнительн/i.test(l));
  let body: string[];
  if (start >= 0) {
    body = [];
    for (const l of lines.slice(start + 1)) {
      if (isMarker(l)) break;
      body.push(l);
    }
  } else {
    // no template: keep the text, minus the lines that are just links
    body = lines.filter((l) => !/https?:\/\/|999\.md/i.test(l));
  }
  return body
    .map((l) => l.replace(/\s+$/, "").replace(/^\s+(?=[-•*])/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Pure mapping of one 999.md advert (list item + its RU features) onto our
 * car fields. Exported so it can be tested without touching the network.
 */
export function mapAdvert(
  item: NnnAdvertListItem,
  features: NnnAdvertFeature[],
  roTitleById: Map<string, string>,
  bodyFallback = "sedan"
): { car: MappedCar | null; warnings: string[] } {
  const warnings: string[] = [];
  const raw: Partial<Record<FeatureKey, NnnAdvertFeature>> = {};
  const equipmentRu: string[] = [];
  const equipmentRo: string[] = [];
  let imageIds: string[] = item.images?.value ?? [];

  const matched = features
    .map((f) => ({ f, m: fieldOf(f.title) }))
    .filter((x): x is { f: NnnAdvertFeature; m: NonNullable<typeof x.m> } => !!x.m)
    // exact titles first, so "Старая цена" never takes the price slot
    .sort((a, b) => Number(b.m.exact) - Number(a.m.exact));
  for (const f of features) {
    if (f.type === "upload_images" && Array.isArray(f.value) && !imageIds.length) {
      imageIds = f.value.map(String);
    } else if (f.type === "check_box" && isOn(f.value)) {
      equipmentRu.push(f.title);
      equipmentRo.push(roTitleById.get(f.id) ?? f.title);
    }
  }
  for (const { f, m } of matched) {
    if (f.type === "check_box" || f.type === "upload_images") continue;
    if (!raw[m.key]) raw[m.key] = f;
  }

  // brand from its option; model from its option / free text, else from the
  // generated "Brand Model" title (the model list is not exposed by the API)
  const brand = raw.brand ? optionTitle(raw.brand) : undefined;
  let model = raw.model ? optionTitle(raw.model) : undefined;
  if (model && /^\d+$/.test(model)) model = undefined;
  const title = (item.title ?? "").replace(/\\s/g, " ").replace(/\s+/g, " ").trim();
  const brandFinal = brand ?? (title.split(" ")[0] || undefined);
  if (!model && brandFinal && title.toLowerCase().startsWith(brandFinal.toLowerCase()))
    model = title.slice(brandFinal.length).trim() || undefined;
  const modelFinal = model?.trim();

  const year = raw.year ? toNumber(optionTitle(raw.year)) : undefined;

  // price: the advert-level price is authoritative; fall back to the feature
  let price = item.price && typeof item.price.value === "number" ? item.price.value : undefined;
  let priceUnit = item.price?.unit ?? "";
  if (price == null && raw.price) {
    price = toNumber(raw.price.value);
    priceUnit = "eur";
  }
  if (price != null && priceUnit && priceUnit.toLowerCase() !== "eur") {
    warnings.push(`Preț în ${priceUnit.toUpperCase()} (nu EUR) — anunț sărit`);
    price = undefined;
  }

  const missing: string[] = [];
  if (!brandFinal) missing.push("marca");
  if (!modelFinal) missing.push("modelul");
  if (!year) missing.push("anul");
  if (price == null || price <= 0) missing.push("prețul");
  if (missing.length) {
    warnings.push(`Lipsesc: ${missing.join(", ")}`);
    return { car: null, warnings };
  }

  const pick = (key: FeatureKey, dict: Record<string, string[]>, fallback: string, label: string) => {
    const t = raw[key] ? optionTitle(raw[key]!) : undefined;
    const k = keyFromRu(dict, t);
    if (!k) warnings.push(`${label}: „${t ?? "—"}" nemapat, folosit „${fallback}"`);
    return k ?? fallback;
  };

  const mileageRaw = raw.mileage ? toNumber(raw.mileage.value) : undefined;
  if (mileageRaw == null) warnings.push("Kilometraj lipsă — setat 0");

  const engine = raw.engine ? toNumber(optionTitle(raw.engine)) : undefined;
  const engineUnit = raw.engine?.units?.[0]?.includes("CENTIMETER") ? "cm3" : "l";
  const power = raw.power ? toNumber(raw.power.value) : undefined;
  const seats = raw.seats ? toNumber(optionTitle(raw.seats)) : undefined;

  const descRaw = raw.description?.value;
  const desc =
    descRaw && typeof descRaw === "object"
      ? (descRaw as { ro?: string; ru?: string })
      : { ro: typeof descRaw === "string" ? descRaw : "" };
  const descriptionRo = cleanDescription(desc.ro ?? desc.ru ?? "");
  const ruSource = desc.ru && desc.ru !== desc.ro && looksRussian(desc.ru) ? desc.ru : undefined;
  const descriptionRu = ruSource ? cleanDescription(ruSource) : descriptionRo;

  return {
    warnings,
    car: {
      brand: brandFinal!,
      model: modelFinal!,
      year: Math.round(year!),
      price: Math.round(price!),
      mileage: Math.round(mileageRaw ?? 0),
      body: pick("body", BODY_RU, bodyFallback, "Caroserie"),
      fuel: pick("fuel", FUEL_RU, "petrol", "Combustibil"),
      transmission: pick("transmission", TRANSMISSION_RU, "manual", "Cutie"),
      drivetrain: keyFromRu(DRIVETRAIN_RU, raw.drivetrain ? optionTitle(raw.drivetrain) : undefined),
      engineCc: engine != null ? engineToCc(engine, engineUnit) : undefined,
      powerHp: power != null ? powerToHp(power, "hp") : undefined,
      color: raw.color ? colorFromRu(optionTitle(raw.color)) : undefined,
      seats: seats != null && seats > 0 && seats <= 60 ? Math.round(seats) : undefined,
      vin: typeof raw.vin?.value === "string" ? raw.vin.value.trim() || undefined : undefined,
      descriptionRo,
      descriptionRu,
      equipmentRo: equipmentRo.join("\n"),
      equipmentRu: equipmentRu.join("\n"),
      imageIds: imageIds.slice(0, MAX_IMAGES),
    },
  };
}

/** CarImage.path for a 999.md photo — both sizes straight from the CDN */
export function imagePath(imageId: string) {
  return JSON.stringify({
    lg: nnnImageUrl(imageId, "900x900"),
    sm: nnnImageUrl(imageId, "320x240"),
  });
}

async function fetchAllAdverts(): Promise<NnnAdvertListItem[]> {
  const out: NnnAdvertListItem[] = [];
  let page = 1;
  for (;;) {
    const res = await listAdverts({ page, page_size: 100, states: ALL_STATES });
    out.push(...(res.adverts ?? []));
    if (out.length >= (res.total ?? 0) || (res.adverts ?? []).length === 0 || page > 50) break;
    page++;
  }
  return out;
}

/** RO titles of every feature (equipment labels), across our subcategories */
async function loadRoTitles(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const subcategory_id of Object.keys(SUBCATEGORIES)) {
    const ro = await getFeatures({
      category_id: CATEGORY_ID,
      subcategory_id,
      offer_type: OFFER_TYPE,
      lang: "ro",
    }).catch(() => undefined);
    for (const g of ro?.features_groups ?? [])
      for (const f of g.features) map.set(String(f.id), f.title);
  }
  return map;
}

type Diffable = Omit<MappedCar, "imageIds">;
const specKeys: (keyof Diffable)[] = [
  "brand", "model", "year", "price", "mileage", "body", "fuel", "transmission",
  "drivetrain", "engineCc", "powerHp", "color", "seats", "vin",
  "descriptionRo", "descriptionRu", "equipmentRo", "equipmentRu",
];

function specsChanged(mapped: MappedCar, car: Record<string, unknown>) {
  return specKeys.some((k) => (mapped[k] ?? null) !== (car[k] ?? null));
}

const subcategoryOf = (a: NnnAdvertListItem) => a.categories?.subcategory?.id ?? "";

export async function importFrom999(
  trigger: "manual" | "cron" | "auto" = "manual",
  { budgetMs = READ_BUDGET_MS, force = false }: { budgetMs?: number; force?: boolean } = {}
): Promise<ImportReport> {
  const report: ImportReport = {
    ok: false, created: 0, updated: 0, archived: 0, skipped: 0, unchanged: 0, warnings: [],
  };
  const startedAt = Date.now();

  if (!nnnConfigured()) {
    report.error = "Cheia API 999.md lipsește (NNN_API_KEY în .env)";
    await prisma.syncRun.create({
      data: { kind: "import", trigger, finishedAt: new Date(), ok: false, error: report.error },
    });
    return report;
  }

  const run = await prisma.syncRun.create({ data: { kind: "import", trigger } });
  report.runId = run.id;

  try {
    const [adverts, roTitles, links] = await Promise.all([
      fetchAllAdverts(),
      loadRoTitles(),
      prisma.advert999.findMany({
        where: { advertId: { not: null } },
        include: { car: { include: { images: { orderBy: { order: "asc" } } } } },
      }),
    ]);
    const linkByAdvert = new Map(links.map((l) => [l.advertId!, l]));
    const seen = new Set(adverts.map((a) => a.id));

    // An advert is re-read only when 999.md shows a change (republished
    // timestamp or price) — the list already tells us that much. New adverts
    // go first, then changed ones, then whatever was left over last time.
    const stamp = (a: NnnAdvertListItem) => a.republished ?? a.posted ?? null;
    const untouched = (a: NnnAdvertListItem) => {
      const link = linkByAdvert.get(a.id);
      if (force || !link || link.state !== "SYNCED" || link.car.status !== "PUBLISHED") return false;
      const s = stamp(a);
      return (
        !!s &&
        link.nnnUpdatedAt?.getTime() === new Date(s).getTime() &&
        a.price?.value === link.car.price
      );
    };
    const rank = (a: NnnAdvertListItem) => (!linkByAdvert.get(a.id) ? 0 : 1);
    const toRead = adverts
      .filter((a) => {
        const link = linkByAdvert.get(a.id);
        return (
          a.state === "public" &&
          SUBCATEGORIES[subcategoryOf(a)] &&
          (!link || link.source === "nnn") &&
          !untouched(a)
        );
      })
      .sort((a, b) => rank(a) - rank(b));
    // network first (one call at a time, the API is rate-limited), then the database
    const featuresById = new Map<string, NnnAdvertFeature[] | Error>();
    const skippedUnchanged = new Set(adverts.filter(untouched).map((a) => a.id));
    let deferred = 0;
    for (const a of toRead) {
      if (Date.now() - startedAt > budgetMs) {
        deferred++;
        continue;
      }
      try {
        featuresById.set(a.id, await getAdvertFeatures(a.id, "ru"));
      } catch (e) {
        featuresById.set(a.id, e instanceof Error ? e : new Error(String(e)));
      }
    }
    if (deferred) report.warnings.push(`${deferred} anunțuri amânate pentru următoarea rulare (limită de timp)`);

    for (const item of adverts) {
      const link = linkByAdvert.get(item.id);
      const label = `#${item.id} ${(item.title ?? "").replace(/\\s/g, " ")}`.trim();
      const nnnUpdatedAt = item.republished || item.posted ? new Date(item.republished ?? item.posted!) : null;

      // born on the site → the site is the master; only note the 999.md state
      if (link && link.source !== "nnn") {
        if (link.nnnState !== item.state)
          await prisma.advert999.update({
            where: { id: link.id },
            data: { nnnState: item.state, nnnUpdatedAt },
          });
        report.unchanged++;
        continue;
      }

      // a category the site does not show (camioane, moto…) → leave it be
      if (!SUBCATEGORIES[subcategoryOf(item)]) {
        report.skipped++;
        continue;
      }

      // not public any more → take it off the site
      if (item.state !== "public") {
        if (link) {
          const changes: Record<string, unknown> = {};
          if (link.car.status === "PUBLISHED") {
            await prisma.car.update({ where: { id: link.carId }, data: { status: "ARCHIVED" } });
            report.archived++;
            changes.lastError = `Anunțul nu mai e public pe 999.md (${item.state}) — arhivat automat`;
          }
          await prisma.advert999.update({
            where: { id: link.id },
            data: { nnnState: item.state, nnnUpdatedAt, ...changes },
          });
        } else {
          report.skipped++;
        }
        continue;
      }

      const features = featuresById.get(item.id);
      if (!features) {
        // nothing changed on 999.md since the last read, or deferred to the next run
        if (skippedUnchanged.has(item.id)) report.unchanged++;
        else report.skipped++;
        continue;
      }
      if (features instanceof Error) {
        report.warnings.push(`${label}: ${features.message}`);
        report.skipped++;
        continue;
      }

      const { car: mapped, warnings } = mapAdvert(
        item,
        features,
        roTitles,
        SUBCATEGORIES[subcategoryOf(item)].bodyFallback
      );
      for (const w of warnings) report.warnings.push(`${label}: ${w}`);
      if (!mapped) {
        report.skipped++;
        continue;
      }
      const { imageIds, ...specs } = mapped;
      const paths = imageIds.map(imagePath);
      if (!paths.length) report.warnings.push(`${label}: fără fotografii`);

      if (!link) {
        const slug = await uniqueCarSlug(specs.brand, specs.model, specs.year);
        await prisma.car.create({
          data: {
            ...specs,
            slug,
            status: "PUBLISHED",
            location: site.address.full,
            // "new" on the site means new on 999.md, not first seen by us
            ...(item.posted ? { createdAt: new Date(item.posted) } : {}),
            images: { create: paths.map((path, i) => ({ path, order: i })) },
            advert: {
              create: {
                advertId: item.id,
                source: "nnn",
                state: "SYNCED",
                nnnState: item.state,
                nnnUpdatedAt,
                lastSyncAt: new Date(),
              },
            },
          },
        });
        report.created++;
        continue;
      }

      // already imported: refresh whatever 999.md changed
      const changed = specsChanged(mapped, link.car as unknown as Record<string, unknown>);
      const photosChanged =
        paths.length !== link.car.images.length || paths.some((p, i) => p !== link.car.images[i].path);
      if (!changed && !photosChanged) {
        await prisma.advert999.update({
          where: { id: link.id },
          data: { nnnState: item.state, nnnUpdatedAt, state: "SYNCED", lastError: null },
        });
        report.unchanged++;
        continue;
      }
      await prisma.car.update({
        where: { id: link.carId },
        data: {
          ...specs,
          // an archived (expired) advert that is public again comes back too
          ...(link.car.status === "ARCHIVED" ? { status: "PUBLISHED" } : {}),
          ...(photosChanged
            ? { images: { deleteMany: {}, create: paths.map((path, i) => ({ path, order: i })) } }
            : {}),
        },
      });
      await prisma.advert999.update({
        where: { id: link.id },
        data: { nnnState: item.state, nnnUpdatedAt, state: "SYNCED", lastSyncAt: new Date(), lastError: null },
      });
      report.updated++;
    }

    // adverts deleted on 999.md → archive their cars
    for (const link of links) {
      if (link.source !== "nnn" || seen.has(link.advertId!)) continue;
      if (link.car.status === "PUBLISHED") {
        await prisma.car.update({ where: { id: link.carId }, data: { status: "ARCHIVED" } });
        report.archived++;
      }
      await prisma.advert999.update({
        where: { id: link.id },
        data: { nnnState: "deleted", lastError: "Anunțul a dispărut de pe 999.md — arhivat automat" },
      });
    }

    report.ok = true;
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
  }

  const summary = `${report.created} noi · ${report.updated} actualizate · ${report.archived} arhivate · ${report.unchanged} neschimbate · ${report.skipped} sărite`;
  await prisma.syncRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      ok: report.ok,
      summary,
      details: report.warnings.join("\n") || null,
      error: report.error ?? null,
    },
  });

  if (report.created || report.updated || report.archived) {
    try {
      revalidatePath("/", "layout");
    } catch {
      /* outside a request (script) — nothing to revalidate */
    }
  }
  return report;
}

/** last import run, for the admin panel */
export function lastImportRun() {
  return prisma.syncRun.findFirst({
    where: { kind: "import" },
    orderBy: { startedAt: "desc" },
  });
}

/** true when no successful import happened in the last `hours` hours */
export async function importIsStale(hours = 6) {
  const last = await prisma.syncRun.findFirst({
    where: { kind: "import", ok: true },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });
  if (!last) return true;
  return Date.now() - last.startedAt.getTime() > hours * 60 * 60 * 1000;
}
