// Import: bring the company's 999.md car adverts onto the site.
//
// Every advert in Transport → Легковые автомобили on the account becomes a
// published car here (photos included). Adverts that were born on 999.md are
// re-read on each run — 999.md stays the master for their specs, price and
// description; admin-only fields (old price, down payment, featured, status,
// location) are never touched. Cars that were born on the site are left alone
// (the site is their master). Adverts that disappear or stop being public
// archive their car on the site.
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { saveCarImageBuffer, deleteCarImageFiles } from "../uploads";
import { uniqueCarSlug } from "../cars";
import { site } from "../site";
import {
  getAdvert,
  getDependentOptions,
  getFeatures,
  listAdverts,
  nnnConfigured,
  nnnImageUrl,
  type NnnAdvert,
  type NnnAdvertListItem,
  type NnnFeature,
} from "./client";
import {
  BODY_RU,
  CATEGORY_ID,
  DRIVETRAIN_RU,
  FEATURE_KEYS,
  FUEL_RU,
  OFFER_TYPE,
  SUBCATEGORY_ID,
  TRANSMISSION_RU,
  colorFromRu,
  engineToCc,
  keyFromRu,
  looksRussian,
  norm,
  powerToHp,
  type FeatureKey,
} from "./mapping";

const MAX_IMAGES = 15;
const ALL_STATES = "public,blocked,blocked_commercial,need_pay,hidden,expired";

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

export type Schema = {
  byId: Map<string, NnnFeature>;
  roTitleById: Map<string, string>;
  fieldOf: (f: NnnFeature) => FeatureKey | undefined;
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

export function buildSchema(
  ru: { features_groups: { features: NnnFeature[] }[] },
  ro?: { features_groups: { features: NnnFeature[] }[] }
): Schema {
  const byId = new Map<string, NnnFeature>();
  for (const g of ru.features_groups) for (const f of g.features) byId.set(f.id, f);
  const roTitleById = new Map<string, string>();
  if (ro) for (const g of ro.features_groups) for (const f of g.features) roTitleById.set(f.id, f.title);

  const cache = new Map<string, FeatureKey | undefined>();
  const fieldOf = (f: NnnFeature) => {
    if (cache.has(f.id)) return cache.get(f.id);
    const t = norm(f.title);
    let found: FeatureKey | undefined;
    for (const key of FIELD_ORDER) {
      const kws = FEATURE_KEYS[key] as readonly string[];
      if (kws.some((k) => t === norm(k))) {
        found = key;
        break;
      }
    }
    if (!found) {
      for (const key of FIELD_ORDER) {
        const kws = FEATURE_KEYS[key] as readonly string[];
        if (kws.some((k) => t.includes(norm(k)))) {
          found = key;
          break;
        }
      }
    }
    cache.set(f.id, found);
    return found;
  };
  return { byId, roTitleById, fieldOf };
}

async function loadSchema(): Promise<Schema> {
  const params = {
    category_id: CATEGORY_ID,
    subcategory_id: SUBCATEGORY_ID,
    offer_type: OFFER_TYPE,
  };
  const [ru, ro] = await Promise.all([
    getFeatures({ ...params, lang: "ru" }),
    getFeatures({ ...params, lang: "ro" }).catch(() => undefined),
  ]);
  return buildSchema(ru, ro);
}

const toNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const optionTitle = (f: NnnFeature, value: unknown): string | undefined => {
  const id = String(value);
  const opt = f.options?.find((o) => o.id === id);
  return opt?.title ?? (f.options ? undefined : id);
};

export type ModelResolver = (
  modelFeatureId: string,
  brandOptionId: string
) => Promise<{ id: string; title: string }[]>;

/**
 * Pure mapping of one 999.md advert onto our car fields. Exported so it can
 * be unit-tested with a fake schema/advert without touching the network.
 */
export async function mapAdvert(
  advert: NnnAdvert,
  schema: Schema,
  resolveModels: ModelResolver
): Promise<{ car: MappedCar | null; warnings: string[] }> {
  const warnings: string[] = [];
  const raw: Partial<Record<FeatureKey, { f: NnnFeature; value: unknown; unit?: string }>> = {};
  const equipmentRu: string[] = [];
  const equipmentRo: string[] = [];
  let imageIds: string[] = [];

  for (const fv of advert.features ?? []) {
    const f = schema.byId.get(String(fv.id));
    if (!f) continue;
    if (f.type === "upload_images") {
      imageIds = Array.isArray(fv.value) ? fv.value.map(String) : [];
      continue;
    }
    if (f.type === "check_box") {
      const on = fv.value === true || fv.value === "true" || fv.value === 1 || fv.value === "1";
      if (on) {
        equipmentRu.push(f.title);
        equipmentRo.push(schema.roTitleById.get(f.id) ?? f.title);
      }
      continue;
    }
    const key = schema.fieldOf(f);
    if (key && !raw[key]) raw[key] = { f, value: fv.value, unit: fv.unit };
  }

  // brand → model (dependent options)
  const brand = raw.brand ? optionTitle(raw.brand.f, raw.brand.value) : undefined;
  let model: string | undefined;
  if (raw.model) {
    const mf = raw.model.f;
    if (mf.options) model = optionTitle(mf, raw.model.value);
    else if (mf.depends_on && raw.brand) {
      try {
        const opts = await resolveModels(mf.id, String(raw.brand.value));
        model = opts.find((o) => o.id === String(raw.model!.value))?.title;
      } catch {
        warnings.push("Nu s-au putut încărca modelele dependente de marcă");
      }
    }
    if (!model && typeof raw.model.value === "string" && !/^\d+$/.test(raw.model.value))
      model = raw.model.value;
  }
  // last resort: "BMW X3, 2018" style titles
  const titleParts = (advert.title ?? "").replace(/,.*$/, "").trim().split(/\s+/);
  const brandFinal = brand ?? (titleParts[0] || undefined);
  const modelFinal = model ?? (titleParts.slice(1).join(" ") || undefined);

  const year = raw.year
    ? toNumber(raw.year.f.options ? optionTitle(raw.year.f, raw.year.value) : raw.year.value)
    : undefined;

  // price: the advert-level price is authoritative; fall back to the feature
  let price: number | undefined;
  let priceUnit = "";
  if (advert.price && typeof advert.price.value === "number") {
    price = advert.price.value;
    priceUnit = advert.price.unit ?? "";
  } else if (raw.price) {
    price = toNumber(raw.price.value);
    priceUnit = raw.price.unit ?? "";
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

  const pick = (
    key: FeatureKey,
    dict: Record<string, string[]>,
    fallback: string,
    label: string
  ) => {
    const r = raw[key];
    const title = r ? optionTitle(r.f, r.value) : undefined;
    const k = keyFromRu(dict, title);
    if (!k) warnings.push(`${label}: „${title ?? "—"}" nemapat, folosit „${fallback}"`);
    return k ?? fallback;
  };

  const mileageRaw = raw.mileage ? toNumber(raw.mileage.value) : undefined;
  let mileage = mileageRaw ?? 0;
  if (raw.mileage?.unit?.toLowerCase() === "mi") mileage = Math.round(mileage * 1.609);
  if (mileageRaw == null) warnings.push("Kilometraj lipsă — setat 0");

  const drivetrainTitle = raw.drivetrain ? optionTitle(raw.drivetrain.f, raw.drivetrain.value) : undefined;
  const engine = raw.engine ? toNumber(raw.engine.f.options ? optionTitle(raw.engine.f, raw.engine.value) : raw.engine.value) : undefined;
  const power = raw.power ? toNumber(raw.power.value) : undefined;
  const seats = raw.seats ? toNumber(raw.seats.f.options ? optionTitle(raw.seats.f, raw.seats.value) : raw.seats.value) : undefined;

  const body = (advert.body ?? "").trim();
  const descriptionRu = looksRussian(body) ? body : body;
  const descriptionRo = body;
  if (body && looksRussian(body)) warnings.push("Descrierea e doar în rusă — tradu în admin");

  return {
    warnings,
    car: {
      brand: brandFinal!,
      model: modelFinal!,
      year: Math.round(year!),
      price: Math.round(price!),
      mileage: Math.round(mileage),
      body: pick("body", BODY_RU, "sedan", "Caroserie"),
      fuel: pick("fuel", FUEL_RU, "petrol", "Combustibil"),
      transmission: pick("transmission", TRANSMISSION_RU, "manual", "Cutie"),
      drivetrain: keyFromRu(DRIVETRAIN_RU, drivetrainTitle),
      engineCc: engine != null ? engineToCc(engine, raw.engine?.unit) : undefined,
      powerHp: power != null ? powerToHp(power, raw.power?.unit) : undefined,
      color: raw.color ? colorFromRu(optionTitle(raw.color.f, raw.color.value)) : undefined,
      seats: seats != null && seats > 0 && seats <= 12 ? Math.round(seats) : undefined,
      vin: raw.vin && typeof raw.vin.value === "string" ? raw.vin.value.trim() : undefined,
      descriptionRo,
      descriptionRu,
      equipmentRo: equipmentRo.join("\n"),
      equipmentRu: equipmentRu.join("\n"),
      imageIds: imageIds.slice(0, MAX_IMAGES),
    },
  };
}

const isCarAdvert = (a: NnnAdvertListItem) =>
  !a.categories?.subcategory?.id || a.categories.subcategory.id === SUBCATEGORY_ID;

async function fetchAllAdverts(): Promise<NnnAdvertListItem[]> {
  const out: NnnAdvertListItem[] = [];
  let page = 1;
  for (;;) {
    const res = await listAdverts({ page, page_size: 100, states: ALL_STATES });
    out.push(...(res.adverts ?? []));
    if (out.length >= (res.total ?? 0) || (res.adverts ?? []).length === 0 || page > 50) break;
    page++;
  }
  return out.filter(isCarAdvert);
}

async function downloadImages(carId: string, imageIds: string[]) {
  const saved: { path: string; width: number; height: number }[] = [];
  for (const id of imageIds) {
    try {
      const res = await fetch(nnnImageUrl(id, "900x900"), { cache: "no-store" });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const img = await saveCarImageBuffer(carId, buf);
      saved.push({ path: img.basePath, width: img.width, height: img.height });
    } catch {
      /* skip broken photo */
    }
  }
  return saved;
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

export async function importFrom999(
  trigger: "manual" | "cron" | "auto" = "manual"
): Promise<ImportReport> {
  const report: ImportReport = {
    ok: false, created: 0, updated: 0, archived: 0, skipped: 0, unchanged: 0, warnings: [],
  };

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
    const [adverts, schema, links] = await Promise.all([
      fetchAllAdverts(),
      loadSchema(),
      prisma.advert999.findMany({
        where: { advertId: { not: null } },
        include: { car: { include: { images: true } } },
      }),
    ]);
    const linkByAdvert = new Map(links.map((l) => [l.advertId!, l]));
    const seen = new Set<string>();

    const modelCache = new Map<string, { id: string; title: string }[]>();
    const resolveModels: ModelResolver = async (featureId, brandOptionId) => {
      const key = `${featureId}:${brandOptionId}`;
      if (!modelCache.has(key)) {
        const dep = await getDependentOptions({
          subcategory_id: SUBCATEGORY_ID,
          dependency_feature_id: featureId,
          parent_option_id: brandOptionId,
        });
        modelCache.set(key, dep.options ?? []);
      }
      return modelCache.get(key)!;
    };

    for (const item of adverts) {
      seen.add(item.id);
      const link = linkByAdvert.get(item.id);
      const label = `#${item.id} ${item.title ?? ""}`.trim();
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

      let advert: NnnAdvert;
      try {
        advert = await getAdvert(item.id, "ro");
      } catch (e) {
        report.warnings.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
        report.skipped++;
        continue;
      }

      const { car: mapped, warnings } = await mapAdvert(advert, schema, resolveModels);
      for (const w of warnings) report.warnings.push(`${label}: ${w}`);
      if (!mapped) {
        report.skipped++;
        continue;
      }
      const { imageIds, ...specs } = mapped;

      if (!link) {
        const slug = await uniqueCarSlug(specs.brand, specs.model, specs.year);
        const car = await prisma.car.create({
          data: {
            ...specs,
            slug,
            status: "PUBLISHED",
            location: site.address.full,
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
        const imgs = await downloadImages(car.id, imageIds);
        if (imgs.length)
          await prisma.carImage.createMany({
            data: imgs.map((img, i) => ({ carId: car.id, ...img, order: i })),
          });
        else report.warnings.push(`${label}: fără fotografii`);
        report.created++;
        continue;
      }

      // already imported: refresh specs when 999.md changed them
      const changed = specsChanged(mapped, link.car as unknown as Record<string, unknown>);
      const photosChanged = imageIds.length !== link.car.images.length;
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
        },
      });
      if (photosChanged) {
        const imgs = await downloadImages(link.carId, imageIds);
        if (imgs.length) {
          for (const old of link.car.images) await deleteCarImageFiles(old.path);
          await prisma.carImage.deleteMany({ where: { carId: link.carId } });
          await prisma.carImage.createMany({
            data: imgs.map((img, i) => ({ carId: link.carId, ...img, order: i })),
          });
        }
      }
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

  if (report.created || report.updated || report.archived) revalidatePath("/", "layout");
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
