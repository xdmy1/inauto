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

export const STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;

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
    where.OR = [{ brand: { contains: f.q } }, { model: { contains: f.q } }];
  }
  if (f.brand) where.brand = f.brand;
  if (f.model) where.model = { contains: f.model };
  if (f.body) where.body = f.body;
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
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
  ]);
  return { total, cars, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function getBrandsWithCounts() {
  const rows = await prisma.car.groupBy({
    by: ["brand"],
    where: { status: "PUBLISHED" },
    _count: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => ({ brand: r.brand, count: r._count.brand }));
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
