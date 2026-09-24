import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

// Canonical option keys stored in DB; translated for display via messages
export const BODIES = [
  "sedan",
  "hatchback",
  "wagon",
  "suv",
  "coupe",
  "cabrio",
  "minivan",
  "van",
  "pickup",
] as const;

export const FUELS = [
  "petrol",
  "diesel",
  "hybrid",
  "phev",
  "electric",
  "gas",
] as const;

export const TRANSMISSIONS = ["automatic", "manual", "robotic", "cvt"] as const;

export const DRIVETRAINS = ["fwd", "rwd", "awd"] as const;

// The minibus category groups the two body types the dealer sells as one:
// passenger minibuses ("minivan") and cargo vans ("van").
export const MINIBUS_BODIES = ["minivan", "van"] as const;
export const MINIBUS = MINIBUS_BODIES.join(",");
/** prisma scope for "cars only" (what /auto shows without a body filter) */
export const CARS_ONLY: Prisma.CarWhereInput = { body: { notIn: [...MINIBUS_BODIES] } };

export const STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;

export const STATUS_RO: Record<(typeof STATUSES)[number], string> = {
  DRAFT: "Ciornă",
  PUBLISHED: "Publicat",
  RESERVED: "Rezervat",
  SOLD: "Vândut",
  ARCHIVED: "Arhivat",
};

export const PER_PAGE = 12;

export type CarFilters = {
  q?: string;
  brand?: string;
  model?: string;
  body?: string;
  fuel?: string;
  transmission?: string;
  drivetrain?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  engineMin?: number;
  engineMax?: number;
  seats?: number;
  color?: string;
  sort?: "new" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";
  page?: number;
};

export function parseFilters(
  params: Record<string, string | string[] | undefined>
): CarFilters {
  const s = (k: string) => {
    const v = params[k];
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };
  const n = (k: string) => {
    const v = s(k);
    if (!v) return undefined;
    const num = Number(v.replace(/\D/g, ""));
    return Number.isFinite(num) && num > 0 ? num : undefined;
  };
  const sort = s("sort");
  return {
    q: s("q"),
    brand: s("brand"),
    model: s("model"),
    body: s("body"),
    fuel: s("fuel"),
    transmission: s("transmission"),
    drivetrain: s("drivetrain"),
    priceMin: n("priceMin"),
    priceMax: n("priceMax"),
    yearMin: n("yearMin"),
    yearMax: n("yearMax"),
    mileageMin: n("mileageMin"),
    mileageMax: n("mileageMax"),
    engineMin: n("engineMin"),
    engineMax: n("engineMax"),
    seats: n("seats"),
    color: s("color"),
    sort:
      sort === "price_asc" ||
      sort === "price_desc" ||
      sort === "year_desc" ||
      sort === "mileage_asc"
        ? sort
        : "new",
    page: Math.max(1, n("page") ?? 1),
  };
}

export function filtersToWhere(f: CarFilters): Prisma.CarWhereInput {
  const where: Prisma.CarWhereInput = { status: "PUBLISHED" };
  if (f.q) {
    // "bmw x3" → every word must match brand or model
    where.AND = f.q
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({
        OR: [
          { brand: { contains: word, mode: "insensitive" } },
          { model: { contains: word, mode: "insensitive" } },
        ],
      }));
  }
  if (f.brand) where.brand = { equals: f.brand, mode: "insensitive" };
  if (f.model) where.model = { contains: f.model, mode: "insensitive" };
  // no body chosen = the car catalogue; minibuses only show in their own category
  if (f.body)
    where.body = f.body.includes(",")
      ? { in: f.body.split(",").filter(Boolean) }
      : f.body;
  else where.body = { notIn: [...MINIBUS_BODIES] };
  if (f.fuel) where.fuel = f.fuel;
  if (f.transmission) where.transmission = f.transmission;
  if (f.drivetrain) where.drivetrain = f.drivetrain;
  if (f.priceMin || f.priceMax)
    where.price = { gte: f.priceMin, lte: f.priceMax };
  if (f.yearMin || f.yearMax) where.year = { gte: f.yearMin, lte: f.yearMax };
  if (f.mileageMin || f.mileageMax)
    where.mileage = { gte: f.mileageMin, lte: f.mileageMax };
  if (f.engineMin || f.engineMax)
    where.engineCc = { gte: f.engineMin, lte: f.engineMax };
  if (f.seats) where.seats = f.seats;
  if (f.color) where.color = f.color;
  return where;
}

export function filtersToOrderBy(
  f: CarFilters
): Prisma.CarOrderByWithRelationInput[] {
  switch (f.sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "year_desc":
      return [{ year: "desc" }];
    case "mileage_asc":
      return [{ mileage: "asc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function getPublishedCars(f: CarFilters) {
  const where = filtersToWhere(f);
  const [total, cars] = await Promise.all([
    prisma.car.count({ where }),
    prisma.car.findMany({
      where,
      orderBy: filtersToOrderBy(f),
      skip: ((f.page ?? 1) - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { images: { orderBy: { order: "asc" }, take: 3 } },
    }),
  ]);
  return { total, cars, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export type BrandCount = { brand: string; count: number };

export async function getBrandsWithCounts(
  scope?: Prisma.CarWhereInput
): Promise<BrandCount[]> {
  const rows = await prisma.car.groupBy({
    by: ["brand"],
    where: { status: "PUBLISHED", ...scope },
    _count: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => ({ brand: r.brand, count: r._count.brand }));
}

export async function getBodyCounts() {
  const rows = await prisma.car.groupBy({
    by: ["body"],
    where: { status: "PUBLISHED" },
    _count: { body: true },
  });
  const map = new Map(rows.map((r) => [r.body, r._count.body]));
  return BODIES.map((b) => ({ body: b, count: map.get(b) ?? 0 }));
}

export const BUDGETS = [
  { key: "under", query: "priceMax=9999", min: 0, max: 9999 },
  { key: "mid", query: "priceMin=10000&priceMax=20000", min: 10000, max: 20000 },
  { key: "over", query: "priceMin=20001", min: 20001, max: undefined },
] as const;

export async function getBudgetCounts() {
  return Promise.all(
    BUDGETS.map(async (b) => ({
      ...b,
      count: await prisma.car.count({
        where: { status: "PUBLISHED", price: { gte: b.min, lte: b.max } },
      }),
    }))
  );
}

/** brand → URL segment ("Mercedes-Benz" → "mercedes-benz") */
export function brandSlug(brand: string) {
  return slugify(brand);
}

/** resolve a brand URL segment back to the exact brand stored in the DB */
export async function brandFromSlug(slug: string) {
  const brands = await getBrandsWithCounts();
  return brands.find((b) => brandSlug(b.brand) === slug.toLowerCase());
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueCarSlug(brand: string, model: string, year: number) {
  const base = slugify(`${brand}-${model}-${year}`);
  let slug = base;
  let i = 2;
  while (await prisma.car.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// ——— formatting ———

export function fmtPrice(eur: number) {
  return `${new Intl.NumberFormat("ro-RO").format(eur)} €`;
}

export function fmtKm(km: number) {
  return `${new Intl.NumberFormat("ro-RO").format(km)} km`;
}

/** 1995 → "2.0 L" */
export function fmtEngine(cc: number) {
  return `${(Math.round(cc / 100) / 10).toFixed(1)} L`;
}

/** listed in the last 10 days */
export function isNewListing(createdAt: Date) {
  return Date.now() - createdAt.getTime() < 10 * 24 * 60 * 60 * 1000;
}

/** "Climatronic\nScaune încălzite" → ["Climatronic", "Scaune încălzite"] */
export function equipmentList(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
