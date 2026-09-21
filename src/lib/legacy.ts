import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { brandSlug, getBrandsWithCounts, slugify } from "./cars";

// The old inauto.md kept its cars at /car/<slug> (2022–2025) and, before that,
// at /listings/<slug>/ (WordPress). Google still holds those URLs, so each one
// is answered with a 301 to the closest thing in stock today:
//   the same brand-model-year → a car of the same model → the brand page → the catalog.
// Old slugs look like "audi-q7-173" (brand-model-id), "bmw-x3" or "audi-a4-2012-2".
export async function legacyCarTarget(raw: string): Promise<string> {
  const slug = slugify(decodeURIComponent(raw));
  if (!slug) return "/auto";

  const exact = await prisma.car.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { slug: true },
  });
  if (exact) return `/auto/${exact.slug}`;

  const brands = await getBrandsWithCounts();
  const brand = brands
    .map((b) => ({ name: b.brand, slug: brandSlug(b.brand) }))
    .sort((a, b) => b.slug.length - a.slug.length)
    .find((b) => slug === b.slug || slug.startsWith(`${b.slug}-`));
  if (!brand) return "/auto";

  const rest = slug.slice(brand.slug.length + 1);
  if (rest) {
    const cars = await prisma.car.findMany({
      where: { brand: brand.name, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { slug: true, model: true },
    });
    // "sprinter-26" → "sprinter": the old slug without its trailing id
    const stem = rest.replace(/(-\d+)+$/, "");
    // best first: the very model → the longest model the old slug starts with
    // ("x3-175" → X3, not X) → a longer name of the same model (Sprinter → Sprinter Pasager)
    const rank = (model: string) =>
      model === rest || model === stem
        ? 3000
        : rest.startsWith(`${model}-`)
          ? 2000 + model.length
          : stem.length > 1 && model.startsWith(`${stem}-`)
            ? 1000 - model.length
            : 0;
    const match = cars
      .map((c) => ({ slug: c.slug, rank: rank(slugify(c.model)) }))
      .filter((c) => c.rank > 0)
      .sort((a, b) => b.rank - a.rank)[0];
    if (match) return `/auto/${match.slug}`;
  }
  return `/marca/${brand.slug}`;
}

export async function legacyCarRedirect(request: Request, slug: string) {
  const target = await legacyCarTarget(slug).catch(() => "/auto");
  return new NextResponse(null, {
    status: 301,
    headers: {
      Location: new URL(target, request.url).toString(),
      // the stock changes — a browser should not remember the answer forever
      "Cache-Control": "public, max-age=3600",
    },
  });
}
