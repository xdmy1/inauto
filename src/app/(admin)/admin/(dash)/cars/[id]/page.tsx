import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CarForm } from "@/components/admin/CarForm";
import { NnnPanel } from "@/components/admin/NnnPanel";
import { nnnAdvertUrl } from "@/lib/nnn/client";
import { daysLeft, fmtDateTime } from "@/lib/adminDates";
import ro from "@/messages/ro.json";

// 999.md option keys → the site's RO labels (unknown values as 999.md wrote them)
const optRo = (group: keyof typeof ro.options, key: string | null) =>
  key ? ((ro.options[group] as Record<string, string>)[key] ?? key) : null;

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      advert: true,
    },
  });
  if (!car) notFound();

  const a = car.advert;
  const facts = [
    { label: "Vizualizări pe 999", value: a?.views != null ? a.views.toLocaleString("ro-RO") : null },
    { label: "Postat pe 999", value: a?.postedAt ? fmtDateTime(a.postedAt) : null },
    { label: "Adus pe site", value: a?.source === "nnn" ? fmtDateTime(a.createdAt) : null },
    { label: "Expiră pe 999", value: a?.expiresAt && a.nnnState === "public" ? daysLeft(a.expiresAt) : null },
    { label: "Țara de origine", value: optRo("origin", car.origin) },
    { label: "Înmatriculare", value: optRo("registration", car.registration) },
    { label: "Stare", value: optRo("condition", car.condition) },
    { label: "Disponibilitate", value: optRo("availability", car.availability) },
    { label: "Volan", value: optRo("steering", car.steering) },
    { label: "Uși", value: car.doors ? String(car.doors) : null },
    { label: "Autonomie", value: car.rangeKm ? `${car.rangeKm} km` : null },
  ].filter((f): f is { label: string; value: string } => !!f.value);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">
            ← Înapoi la listă
          </Link>
          <h1 className="mt-2 font-display text-2xl font-extrabold">
            {car.brand} {car.model} {car.year}
          </h1>
        </div>
        <a
          href={`/auto/${car.slug}`}
          target="_blank"
          className="rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-semibold hover:border-ink"
        >
          Vezi pe site ↗
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <CarForm car={car} />
        <div className="xl:order-last">
          <NnnPanel
            carId={car.id}
            advert={
              car.advert
                ? {
                    advertId: car.advert.advertId,
                    source: car.advert.source,
                    state: car.advert.state,
                    nnnState: car.advert.nnnState,
                    lastError: car.advert.lastError,
                    lastSyncAt: car.advert.lastSyncAt?.toISOString() ?? null,
                    url:
                      car.advert.advertId && car.advert.advertId !== "DRY-RUN"
                        ? nnnAdvertUrl(car.advert.advertId)
                        : null,
                    facts,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
