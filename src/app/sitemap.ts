import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { brandSlug, getBrandsWithCounts } from "@/lib/cars";

// cars come and go daily — build the sitemap per request, never at build time
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await prisma.car
    .findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const brands = await getBrandsWithCounts().catch(() => []);
  const staticPaths = ["", "/auto", "/despre", "/contacte"];

  const entry = (
    path: string,
    lastModified?: Date,
    priority = 0.7
  ): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path || "/"}`,
    lastModified,
    priority,
    alternates: {
      languages: {
        ro: `${site.url}${path || "/"}`,
        ru: `${site.url}/ru${path}`,
      },
    },
  });

  return [
    ...staticPaths.map((p) => entry(p, undefined, p === "" ? 1 : 0.8)),
    ...brands.map((b) => entry(`/marca/${brandSlug(b.brand)}`, undefined, 0.75)),
    ...cars.map((c) => entry(`/auto/${c.slug}`, c.updatedAt, 0.7)),
  ];
}
