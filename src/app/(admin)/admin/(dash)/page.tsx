import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtPrice, STATUS_RO, STATUSES } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { nnnAdvertUrl, nnnMode } from "@/lib/nnn/client";
import { importFrom999, importIsStale, lastImportRun } from "@/lib/nnn/import";
import { nnnConfigured } from "@/lib/nnn/client";
import { after } from "next/server";
import { deleteCarAction } from "../actions";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { NnnImportPanel } from "@/components/admin/NnnImportPanel";

const NNN_STYLE: Record<string, string> = {
  SYNCED: "bg-green-100 text-green-800",
  DRY_RUN: "bg-amber-100 text-amber-800",
  ERROR: "bg-red-100 text-red-700",
  PENDING: "bg-gray-100 text-gray-600",
};

const NNN_LABEL: Record<string, string> = {
  SYNCED: "sincronizat",
  DRY_RUN: "simulare",
  ERROR: "eroare",
  PENDING: "în așteptare",
  DISABLED: "dezactivat",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where = status && STATUSES.includes(status as never) ? { status } : {};

  const [cars, counts, lastRun, sources] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        advert: true,
      },
    }),
    prisma.car.groupBy({ by: ["status"], _count: true }),
    lastImportRun(),
    prisma.advert999.groupBy({
      by: ["source"],
      where: { advertId: { not: null } },
      _count: true,
    }),
  ]);

  // keep the site fresh: when the panel is opened and the last successful
  // import is older than 6 hours, run one in the background (needs the key)
  if (nnnConfigured() && (await importIsStale(6))) {
    after(() => importFrom999("auto").catch(() => {}));
  }

  const countFor = (s: string) =>
    counts.find((c) => c.status === s)?._count ?? 0;
  const totalCount = counts.reduce((a, c) => a + c._count, 0);
  const sourceCount = (s: string) =>
    sources.find((r) => r.source === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <NnnImportPanel
        mode={nnnMode()}
        lastRun={
          lastRun
            ? {
                startedAt: lastRun.startedAt.toISOString(),
                ok: lastRun.ok,
                trigger: lastRun.trigger,
                summary: lastRun.summary,
                error: lastRun.error,
                details: lastRun.details,
              }
            : null
        }
        fromNnn={sourceCount("nnn")}
        fromSite={sourceCount("site")}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold">Mașini</h1>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !status ? "chip-dark" : "chip-3d text-ink-soft"
            }`}
          >
            Toate ({totalCount})
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                status === s ? "chip-dark" : "chip-3d text-ink-soft"
              }`}
            >
              {STATUS_RO[s]} ({countFor(s)})
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-semibold">Mașina</th>
              <th className="px-4 py-3 font-semibold">Preț</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">999.md</th>
              <th className="px-4 py-3 text-right font-semibold">Acțiuni</th>
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
            {cars.map((car) => {
              const adv = car.advert;
              const real = !!adv?.advertId && adv.advertId !== "DRY-RUN";
              return (
                <tr key={car.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/cars/${car.id}`}
                      className="flex items-center gap-3"
                    >
                      {car.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                          {car.featured ? " · promovată" : ""}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {fmtPrice(car.price)}
                    {car.oldPrice && car.oldPrice > car.price && (
                      <span className="ml-1.5 text-xs font-normal text-ink-faint line-through">
                        {fmtPrice(car.oldPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect carId={car.id} status={car.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                          NNN_STYLE[adv?.state ?? "PENDING"] ?? NNN_STYLE.PENDING
                        }`}
                        title={adv?.lastError ?? undefined}
                      >
                        {adv ? NNN_LABEL[adv.state] ?? adv.state : "—"}
                      </span>
                      {adv && (
                        <span className="text-[11px] text-ink-faint">
                          {adv.source === "nnn" ? "de pe 999.md" : "de pe site"}
                          {real && (
                            <>
                              {" · "}
                              <a
                                href={nnnAdvertUrl(adv.advertId!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                #{adv.advertId}
                              </a>
                            </>
                          )}
                          {adv.nnnState === "hidden" && " · ascuns"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cars/${car.id}`}
                        className="chip-3d rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      >
                        Editează
                      </Link>
                      <form action={deleteCarAction}>
                        <input type="hidden" name="carId" value={car.id} />
                        <ConfirmSubmit
                          message={`Ștergi definitiv ${car.brand} ${car.model} ${car.year}?`}
                          className="chip-3d rounded-lg px-2.5 py-1.5 text-xs font-semibold text-accent"
                        >
                          Șterge
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
