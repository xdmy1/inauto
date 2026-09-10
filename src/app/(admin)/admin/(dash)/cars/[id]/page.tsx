import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CarForm } from "@/components/admin/CarForm";
import { NnnPanel } from "@/components/admin/NnnPanel";

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
                    state: car.advert.state,
                    lastError: car.advert.lastError,
                    lastSyncAt: car.advert.lastSyncAt?.toISOString() ?? null,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
