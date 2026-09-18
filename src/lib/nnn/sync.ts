// Export: sync a local car listing to 999.md (create / update / hide advert).
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
  setAccessPolicy,
  updateAdvert,
  uploadImage,
  type NnnFeature,
  type NnnFeatureValue,
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
  norm,
} from "./mapping";

const MAX_IMAGES = 10;

type FlatFeature = NnnFeature;

let featureCache: { at: number; features: FlatFeature[] } | null = null;

export async function loadFeatures(): Promise<FlatFeature[]> {
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

function findFeature(features: FlatFeature[], keywords: readonly string[]) {
  // exact title first, then "contains"
  return (
    features.find((f) => keywords.some((k) => norm(f.title) === norm(k))) ??
    features.find((f) => keywords.some((k) => norm(f.title).includes(norm(k))))
  );
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

export type SyncReport = {
  ok: boolean;
  advertId?: string;
  action: "created" | "updated" | "hidden" | "shown" | "dry-run" | "error";
  warnings: string[];
  error?: string;
};

type CarWithImages = NonNullable<Awaited<ReturnType<typeof loadCar>>>;

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
    keywords: readonly string[],
    label: string,
    make: (
      f: FlatFeature
    ) => NnnFeatureValue | undefined | Promise<NnnFeatureValue | undefined>
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

  // Brand (dropdown) → Model (depends on brand)
  const brandFeature = findFeature(features, FEATURE_KEYS.brand);
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

  const modelFeature = findFeature(features, FEATURE_KEYS.model);
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
    // "X3 xDrive20d" → try the full model, then the first word ("X3")
    const opt =
      findOption(options, [car.model]) ??
      findOption(options, [car.model.split(" ")[0]]);
    if (opt) values.push({ id: modelFeature.id, value: opt.id });
    else if (modelFeature.type.startsWith("textbox"))
      values.push({ id: modelFeature.id, value: car.model });
    else warnings.push(`Modelul „${car.model}" nu există în lista 999.md`);
  }

  await push(FEATURE_KEYS.year, "anul producerii", (f) => {
    if (!f.options) return { id: f.id, value: car.year };
    const opt = findOption(f.options, [String(car.year)]);
    return opt && { id: f.id, value: opt.id };
  });

  await push(FEATURE_KEYS.title, "titlu", (f) => ({
    id: f.id,
    value: {
      ro: `${car.brand} ${car.model}, ${car.year}`,
      ru: `${car.brand} ${car.model}, ${car.year} г.`,
    },
  }));

  await push(FEATURE_KEYS.description, "descriere", (f) => ({
    id: f.id,
    value: {
      ro:
        car.descriptionRo ||
        `${car.brand} ${car.model} ${car.year}. ${site.name}, ${site.address.full}.`,
      ru:
        car.descriptionRu ||
        car.descriptionRo ||
        `${car.brand} ${car.model} ${car.year}. ${site.name}.`,
    },
  }));

  await push(FEATURE_KEYS.price, "preț", (f) => ({
    id: f.id,
    value: car.price,
    unit: f.units?.includes("eur") ? "eur" : f.units?.[0],
  }));

  await push(FEATURE_KEYS.mileage, "kilometraj", (f) => ({
    id: f.id,
    value: car.mileage,
    unit: f.units?.includes("km") ? "km" : f.units?.[0],
  }));

  await push(FEATURE_KEYS.fuel, "combustibil", (f) => {
    const opt = findOption(f.options, FUEL_RU[car.fuel] ?? [car.fuel]);
    return opt && { id: f.id, value: opt.id };
  });

  await push(FEATURE_KEYS.transmission, "cutia de viteze", (f) => {
    const opt = findOption(
      f.options,
      TRANSMISSION_RU[car.transmission] ?? [car.transmission]
    );
    return opt && { id: f.id, value: opt.id };
  });

  await push(FEATURE_KEYS.body, "caroserie", (f) => {
    const opt = findOption(f.options, BODY_RU[car.body] ?? [car.body]);
    return opt && { id: f.id, value: opt.id };
  });

  if (car.drivetrain) {
    await push(FEATURE_KEYS.drivetrain, "tracțiune", (f) => {
      const opt = findOption(
        f.options,
        DRIVETRAIN_RU[car.drivetrain!] ?? [car.drivetrain!]
      );
      return opt && { id: f.id, value: opt.id };
    });
  }

  if (car.engineCc) {
    await push(FEATURE_KEYS.engine, "capacitate motor", (f) => {
      const cm3 = f.units?.find((u) => u.toLowerCase() === "cm3");
      const l = f.units?.find((u) => u.toLowerCase() === "l");
      if (cm3) return { id: f.id, value: car.engineCc!, unit: cm3 };
      if (l) return { id: f.id, value: Math.round(car.engineCc! / 100) / 10, unit: l };
      return { id: f.id, value: car.engineCc!, unit: f.units?.[0] };
    });
  }

  if (car.powerHp) {
    await push(FEATURE_KEYS.power, "putere", (f) => ({
      id: f.id,
      value: car.powerHp!,
      unit: f.units?.find((u) => u.toLowerCase() === "hp") ?? f.units?.[0],
    }));
  }

  if (car.color) {
    await push(FEATURE_KEYS.color, "culoare", (f) => {
      if (!f.options) return { id: f.id, value: car.color! };
      // our colours are RO labels; 999.md options are RU — match through the dictionary
      const ruTitles = Object.entries(COLOR_RO_RU).find(
        ([ro]) => norm(ro) === norm(car.color!)
      )?.[1];
      const opt = findOption(f.options, ruTitles ? [ruTitles] : [car.color!]);
      return opt && { id: f.id, value: opt.id };
    });
  }

  if (car.seats) {
    await push(FEATURE_KEYS.seats, "locuri", (f) => {
      if (!f.options) return { id: f.id, value: car.seats! };
      const opt = findOption(f.options, [String(car.seats)]);
      return opt && { id: f.id, value: opt.id };
    });
  }

  if (car.vin) {
    const f = findFeature(features, FEATURE_KEYS.vin);
    if (f) values.push({ id: f.id, value: car.vin });
  }

  // Equipment: check_box features whose RU title matches a line of equipmentRu
  const equipment = [car.equipmentRu, car.equipmentRo]
    .flatMap((s) => s.split(/\r?\n/))
    .map(norm)
    .filter(Boolean);
  if (equipment.length) {
    for (const f of features) {
      if (f.type !== "check_box") continue;
      if (equipment.includes(norm(f.title))) values.push({ id: f.id, value: true });
    }
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

// RO colour label → RU option title (reverse of the import dictionary)
const COLOR_RO_RU: Record<string, string> = {
  Alb: "белый",
  Negru: "черный",
  Gri: "серый",
  Argintiu: "серебристый",
  Albastru: "синий",
  Bleu: "голубой",
  Roșu: "красный",
  Verde: "зеленый",
  Galben: "желтый",
  Portocaliu: "оранжевый",
  Maro: "коричневый",
  Bej: "бежевый",
  Bordo: "бордовый",
  Violet: "фиолетовый",
  Auriu: "золотистый",
};

const isRealAdvertId = (id: string | null | undefined): id is string =>
  !!id && id !== "DRY-RUN";

export async function syncCarTo999(carId: string): Promise<SyncReport> {
  const car = await loadCar(carId);
  if (!car) return { ok: false, action: "error", warnings: [], error: "Mașina nu există" };

  const record = async (data: {
    advertId?: string | null;
    state: string;
    nnnState?: string | null;
    lastError?: string | null;
  }) =>
    prisma.advert999.upsert({
      where: { carId },
      create: { carId, source: "site", ...data, lastSyncAt: new Date() },
      update: { ...data, lastSyncAt: new Date() },
    });

  if (!nnnEnabled()) {
    await record({
      state: "DRY_RUN",
      lastError: null,
      advertId: car.advert?.advertId ?? "DRY-RUN",
    });
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
    if (isRealAdvertId(existingId)) {
      await updateAdvert(existingId, { features: values });
      await record({
        advertId: existingId,
        state: "SYNCED",
        lastError: warnings.join("; ") || null,
      });
      return { ok: true, action: "updated", advertId: existingId, warnings };
    }

    const res = await createAdvert({
      category_id: CATEGORY_ID,
      subcategory_id: SUBCATEGORY_ID,
      offer_type: OFFER_TYPE,
      features: values,
    });
    const advertId = res.advert.id;
    await record({
      advertId,
      state: "SYNCED",
      nnnState: "public",
      lastError: warnings.join("; ") || null,
    });
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
  if (!isRealAdvertId(advertId))
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

/**
 * Keep the 999.md advert's visibility in step with the car's status on the
 * site: PUBLISHED → public, anything else (sold, reserved, archived, draft)
 * → private. Silently no-op when the car has no real advert or in dry-run.
 */
export async function syncVisibilityOn999(
  carId: string,
  status: string
): Promise<SyncReport | null> {
  const car = await loadCar(carId);
  const advertId = car?.advert?.advertId;
  if (!car || !isRealAdvertId(advertId) || !nnnEnabled()) return null;

  const wantPublic = status === "PUBLISHED";
  const current = car.advert?.nnnState;
  if ((wantPublic && current === "public") || (!wantPublic && current === "hidden"))
    return null;

  try {
    await setAccessPolicy(advertId, wantPublic ? "public" : "private");
    await prisma.advert999.update({
      where: { carId },
      data: {
        nnnState: wantPublic ? "public" : "hidden",
        lastSyncAt: new Date(),
        lastError: null,
      },
    });
    return {
      ok: true,
      action: wantPublic ? "shown" : "hidden",
      advertId,
      warnings: [],
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.advert999.update({
      where: { carId },
      data: { state: "ERROR", lastError: msg },
    });
    return { ok: false, action: "error", advertId, warnings: [], error: msg };
  }
}
