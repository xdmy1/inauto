// Sync a local car listing to 999.md (create / update advert).
//
// The Partners API describes adverts through dynamic "features" whose ids and
// option ids differ per account/category, so we resolve them at runtime:
// fetch the feature schema for Transport → Легковые автомобили → Продам and
// match our fields against feature titles (RU). Anything we cannot match is
// reported back to the admin instead of failing silently.
import { prisma } from "../prisma";
import { readLargeImage } from "../uploads";
import { site } from "../site";
import {
  createAdvert,
  getDependentOptions,
  getFeatures,
  nnnEnabled,
  republishAdvert,
  updateAdvert,
  uploadImage,
  type NnnFeature,
  type NnnFeatureValue,
} from "./client";

// Fixed ids from the Partners API docs (Transport / Cars / Sell)
const CATEGORY_ID = "658";
const SUBCATEGORY_ID = "659";
const OFFER_TYPE = "776";

const MAX_IMAGES = 10;

type FlatFeature = NnnFeature;

let featureCache: { at: number; features: FlatFeature[] } | null = null;

async function loadFeatures(): Promise<FlatFeature[]> {
  if (featureCache && Date.now() - featureCache.at < 60 * 60 * 1000) {
    return featureCache.features;
  }
  const res = await getFeatures({
    category_id: CATEGORY_ID,
    subcategory_id: SUBCATEGORY_ID,
    offer_type: OFFER_TYPE,
  });
  const features = res.features_groups.flatMap((g) => g.features);
  featureCache = { at: Date.now(), features };
  return features;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").trim();

function findFeature(features: FlatFeature[], keywords: string[]) {
  return features.find((f) => {
    const t = norm(f.title);
    return keywords.some((k) => t.includes(k));
  });
}

function findOption(
  options: { id: string; title: string }[] | null,
  candidates: string[]
) {
  if (!options) return undefined;
  const cand = candidates.map(norm);
  return (
    options.find((o) => cand.includes(norm(o.title))) ??
    options.find((o) => cand.some((c) => norm(o.title).includes(c)))
  );
}

// RU synonyms for our canonical option keys
const FUEL_RU: Record<string, string[]> = {
  petrol: ["бензин"],
  diesel: ["дизель"],
  hybrid: ["гибрид"],
  phev: ["плагин-гибрид", "плагин гибрид", "phev", "гибрид"],
  electric: ["электричество", "электро"],
  gas: ["газ", "газ / бензин", "метан", "пропан"],
};

const TRANSMISSION_RU: Record<string, string[]> = {
  automatic: ["автомат"],
  manual: ["механика", "механическая"],
  robotic: ["робот"],
  cvt: ["вариатор"],
};

const BODY_RU: Record<string, string[]> = {
  sedan: ["седан"],
  hatchback: ["хэтчбек", "хетчбек"],
  wagon: ["универсал"],
  suv: ["внедорожник", "кроссовер", "джип"],
  coupe: ["купе"],
  cabrio: ["кабриолет"],
  minivan: ["минивэн", "минивен"],
  van: ["фургон"],
  pickup: ["пикап"],
};

const DRIVETRAIN_RU: Record<string, string[]> = {
  fwd: ["передний"],
  rwd: ["задний"],
  awd: ["полный", "4x4", "4х4"],
};

export type SyncReport = {
  ok: boolean;
  advertId?: string;
  action: "created" | "updated" | "dry-run" | "error";
  warnings: string[];
  error?: string;
};

type CarWithImages = NonNullable<
  Awaited<ReturnType<typeof loadCar>>
>;

function loadCar(carId: string) {
  return prisma.car.findUnique({
    where: { id: carId },
    include: {
      images: { orderBy: { order: "asc" } },
      advert: true,
    },
  });
}

async function buildFeatureValues(
  car: CarWithImages,
  imageIds: string[]
): Promise<{ values: NnnFeatureValue[]; warnings: string[] }> {
  const features = await loadFeatures();
  const values: NnnFeatureValue[] = [];
  const warnings: string[] = [];

  const push = (
    keywords: string[],
    label: string,
    make: (f: FlatFeature) => NnnFeatureValue | undefined | Promise<NnnFeatureValue | undefined>
  ) => {
    const f = findFeature(features, keywords);
    if (!f) {
      warnings.push(`Câmp 999.md negăsit: ${label}`);
      return Promise.resolve();
    }
    return Promise.resolve(make(f)).then((v) => {
      if (v) values.push(v);
      else warnings.push(`Valoare nemapată pe 999.md: ${label}`);
    });
  };

  // Brand (dropdown) → Model (often depends on brand)
  const brandFeature = findFeature(features, ["марка"]);
  let brandOptionId: string | undefined;
  if (brandFeature) {
    const opt = findOption(brandFeature.options, [car.brand]);
    if (opt) {
      brandOptionId = opt.id;
      values.push({ id: brandFeature.id, value: opt.id });
    } else {
      warnings.push(`Marca „${car.brand}" nu există în lista 999.md`);
    }
  } else {
    warnings.push("Câmp 999.md negăsit: marca");
  }

  const modelFeature = findFeature(features, ["модель"]);
  if (modelFeature) {
    let options = modelFeature.options;
    if (modelFeature.depends_on && brandOptionId) {
      try {
        const dep = await getDependentOptions({
          subcategory_id: SUBCATEGORY_ID,
          dependency_feature_id: modelFeature.id,
          parent_option_id: brandOptionId,
        });
        options = dep.options;
      } catch {
        warnings.push("Nu s-au putut încărca modelele dependente de marcă");
      }
    }
    const opt = findOption(options, [car.model]);
    if (opt) values.push({ id: modelFeature.id, value: opt.id });
    else if (modelFeature.type.startsWith("textbox"))
      values.push({ id: modelFeature.id, value: car.model });
    else warnings.push(`Modelul „${car.model}" nu există în lista 999.md`);
  }

  await push(["год"], "anul producerii", (f) =>
    f.options
      ? findOption(f.options, [String(car.year)]) && {
          id: f.id,
          value: findOption(f.options, [String(car.year)])!.id,
        }
      : { id: f.id, value: car.year }
  );

  await push(["заголовок"], "titlu", (f) => ({
    id: f.id,
    value: {
      ro: `${car.brand} ${car.model}, ${car.year}`,
      ru: `${car.brand} ${car.model}, ${car.year} г.`,
    },
  }));

  await push(["описание"], "descriere", (f) => ({
    id: f.id,
    value: {
      ro: car.descriptionRo || `${car.brand} ${car.model} ${car.year}. ${site.name}, ${site.address.full}.`,
      ru: car.descriptionRu || car.descriptionRo || `${car.brand} ${car.model} ${car.year}. ${site.name}.`,
    },
  }));

  await push(["цена"], "preț", (f) => ({
    id: f.id,
    value: car.price,
    unit: f.units?.includes("eur") ? "eur" : f.units?.[0],
  }));

  await push(["пробег"], "kilometraj", (f) => ({
    id: f.id,
    value: car.mileage,
    unit: f.units?.includes("km") ? "km" : f.units?.[0],
  }));

  await push(["топлив"], "combustibil", (f) => {
    const opt = findOption(f.options, FUEL_RU[car.fuel] ?? [car.fuel]);
    return opt && { id: f.id, value: opt.id };
  });

  await push(["коробка"], "cutia de viteze", (f) => {
    const opt = findOption(
      f.options,
      TRANSMISSION_RU[car.transmission] ?? [car.transmission]
    );
    return opt && { id: f.id, value: opt.id };
  });

  await push(["кузов"], "caroserie", (f) => {
    const opt = findOption(f.options, BODY_RU[car.body] ?? [car.body]);
    return opt && { id: f.id, value: opt.id };
  });

  if (car.drivetrain) {
    await push(["привод"], "tracțiune", (f) => {
      const opt = findOption(
        f.options,
        DRIVETRAIN_RU[car.drivetrain!] ?? [car.drivetrain!]
      );
      return opt && { id: f.id, value: opt.id };
    });
  }

  if (car.engineCc) {
    await push(["объем двигателя", "объём двигателя"], "capacitate motor", (f) => ({
      id: f.id,
      value: car.engineCc!,
      unit: f.units?.includes("cm3") ? "cm3" : f.units?.[0],
    }));
  }

  if (car.powerHp) {
    await push(["мощность"], "putere", (f) => ({
      id: f.id,
      value: car.powerHp!,
      unit: f.units?.includes("hp") ? "hp" : f.units?.[0],
    }));
  }

  // Photos + contacts
  const photoFeature = features.find((f) => f.type === "upload_images");
  if (photoFeature && imageIds.length > 0) {
    values.push({ id: photoFeature.id, value: imageIds });
  } else if (!photoFeature) {
    warnings.push("Câmp 999.md negăsit: fotografii");
  }

  const contactsFeature = features.find((f) => f.type === "contacts");
  if (contactsFeature) {
    values.push({ id: contactsFeature.id, value: [...site.phones] });
  }

  return { values, warnings };
}

export async function syncCarTo999(carId: string): Promise<SyncReport> {
  const car = await loadCar(carId);
  if (!car) return { ok: false, action: "error", warnings: [], error: "Mașina nu există" };

  const record = async (data: {
    advertId?: string | null;
    state: string;
    lastError?: string | null;
  }) =>
    prisma.advert999.upsert({
      where: { carId },
      create: { carId, ...data, lastSyncAt: new Date() },
      update: { ...data, lastSyncAt: new Date() },
    });

  if (!nnnEnabled()) {
    await record({ state: "DRY_RUN", lastError: null, advertId: car.advert?.advertId ?? "DRY-RUN" });
    return {
      ok: true,
      action: "dry-run",
      advertId: "DRY-RUN",
      warnings: [
        "Mod simulare: setează NNN_API_KEY și NNN_DRY_RUN=0 în .env pentru postare reală pe 999.md",
      ],
    };
  }

  try {
    // 1. upload photos (the large webp variants)
    const imageIds: string[] = [];
    for (const img of car.images.slice(0, MAX_IMAGES)) {
      const buf = await readLargeImage(img.path);
      if (!buf) continue;
      imageIds.push(await uploadImage(buf, `${car.slug}-${img.order}.webp`));
    }

    // 2. build feature payload
    const { values, warnings } = await buildFeatureValues(car, imageIds);

    // 3. create or update
    const existingId = car.advert?.advertId;
    if (existingId && existingId !== "DRY-RUN") {
      await updateAdvert(existingId, { features: values });
      await record({ advertId: existingId, state: "SYNCED", lastError: warnings.join("; ") || null });
      return { ok: true, action: "updated", advertId: existingId, warnings };
    }

    const res = await createAdvert({
      category_id: CATEGORY_ID,
      subcategory_id: SUBCATEGORY_ID,
      offer_type: OFFER_TYPE,
      features: values,
    });
    const advertId = res.advert.id;
    await record({ advertId, state: "SYNCED", lastError: warnings.join("; ") || null });
    return { ok: true, action: "created", advertId, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await record({ state: "ERROR", lastError: msg });
    return { ok: false, action: "error", warnings: [], error: msg };
  }
}

export async function republishCarOn999(carId: string): Promise<SyncReport> {
  const car = await loadCar(carId);
  const advertId = car?.advert?.advertId;
  if (!advertId || advertId === "DRY-RUN")
    return { ok: false, action: "error", warnings: [], error: "Anunțul nu e încă publicat pe 999.md" };
  try {
    await republishAdvert(advertId);
    await prisma.advert999.update({
      where: { carId },
      data: { state: "SYNCED", lastSyncAt: new Date(), lastError: null },
    });
    return { ok: true, action: "updated", advertId, warnings: [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.advert999.update({
      where: { carId },
      data: { state: "ERROR", lastError: msg },
    });
    return { ok: false, action: "error", warnings: [], error: msg };
  }
}
