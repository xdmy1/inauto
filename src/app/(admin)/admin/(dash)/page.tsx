import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtPrice, STATUSES } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { deleteCarAction } from "../actions";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

const NNN_STYLE: Record<string, string> = {
  SYNCED: "bg-green-100 text-green-800",
  DRY_RUN: "bg-amber-100 text-amber-800",
  ERROR: "bg-red-100 text-red-700",
  PENDING: "bg-gray-100 text-gray-600",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where = status && STATUSES.includes(status as never) ? { status } : {};

  const [cars, counts] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        advert: true,
      },
    }),
    prisma.car.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) =>
    counts.find((c) => c.status === s)?._count ?? 0;
  const totalCount = counts.reduce((a, c) => a + c._count, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold">Mașini</h1>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !status ? "bg-ink text-paper" : "border border-line bg-card text-ink-soft"
            }`}
          >
            Toate ({totalCount})
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                status === s
                  ? "bg-ink text-paper"
                  : "border border-line bg-card text-ink-soft"
              }`}
            >
              {s} ({countFor(s)})
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-semibold">Mașina</th>
              <th className="px-4 py-3 font-semibold">Preț</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">999.md</th>
              <th className="px-4 py-3 font-semibold text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {cars.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-soft">
                  Nicio mașină.{" "}
                  <Link href="/admin/cars/new" className="font-semibold text-accent">
                    Adaugă prima mașină →
                  </Link>
                </td>
              </tr>
            )}
            {cars.map((car) => (
              <tr key={car.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/cars/${car.id}`}
                    className="flex items-center gap-3"
                  >
                    {car.images[0] ? (
                      <img
                        src={imageUrl(car.images[0].path, "sm")}
                        alt=""
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-line text-xs text-ink-faint">
                        —
                      </span>
                    )}
                    <span>
                      <span className="block font-semibold">
                        {car.brand} {car.model} {car.year}
                      </span>
                      <span className="block text-xs text-ink-faint">
                        {car.mileage.toLocaleString("ro-RO")} km · {car.fuel}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {fmtPrice(car.price)}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect carId={car.id} status={car.status} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                      NNN_STYLE[car.advert?.state ?? "PENDING"] ?? NNN_STYLE.PENDING
                    }`}
                    title={car.advert?.lastError ?? undefined}
                  >
                    {car.advert?.state ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/cars/${car.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-ink"
                    >
                      Editează
                    </Link>
                    <form action={deleteCarAction}>
                      <input type="hidden" name="carId" value={car.id} />
                      <ConfirmSubmit
                        message={`Ștergi definitiv ${car.brand} ${car.model} ${car.year}?`}
                        className="rounded-lg border border-accent/30 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft"
                      >
                        Șterge
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
