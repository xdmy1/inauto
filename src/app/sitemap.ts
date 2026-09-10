import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await prisma.car
    .findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

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
    ...cars.map((c) => entry(`/auto/${c.slug}`, c.updatedAt, 0.7)),
  ];
}
