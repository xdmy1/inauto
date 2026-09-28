import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STATUS_RO, STATUSES } from "@/lib/cars";
import { nnnMode } from "@/lib/nnn/client";
import { importFrom999, importIsStale, lastImportRun } from "@/lib/nnn/import";
import { nnnConfigured } from "@/lib/nnn/client";
import { after } from "next/server";
import { NnnImportPanel } from "@/components/admin/NnnImportPanel";
import { AdminCarRow, type AdminCar } from "@/components/admin/AdminCarRow";
import { ageMs, dayKey, dayLabel, daysAgo, fmtDateTime } from "@/lib/adminDates";

// "Active" = everything that still matters day to day (not sold / archived)
const ACTIVE = ["PUBLISHED", "RESERVED", "DRAFT"];
const TABS: { key: string; label: string; where: Prisma.CarWhereInput }[] = [
  { key: "", label: "Active", where: { status: { in: ACTIVE } } },
  ...STATUSES.map((s) => ({ key: s, label: STATUS_RO[s], where: { status: s } })),
  { key: "all", label: "Toate", where: {} },
];

const SORTS = {
  new: { label: "Cele mai noi", orderBy: [{ createdAt: "desc" }] },
  views: {
    label: "Cele mai văzute pe 999",
    orderBy: [{ advert: { views: { sort: "desc", nulls: "last" } } }, { createdAt: "desc" }],
  },
  price_asc: { label: "Preț ↑", orderBy: [{ price: "asc" }] },
  price_desc: { label: "Preț ↓", orderBy: [{ price: "desc" }] },
} satisfies Record<string, { label: string; orderBy: Prisma.CarOrderByWithRelationInput[] }>;
type SortKey = keyof typeof SORTS;

/** the last import that actually brought new cars, and when it ran */
async function lastImportWithNewCars() {
  const runs = await prisma.syncRun.findMany({
    where: { kind: "import", ok: true, summary: { not: { startsWith: "0 noi" } } },
    orderBy: { startedAt: "desc" },
    take: 1,
  });
  const run = runs[0];
  // a week later those cars are simply part of the list
  if (!run || ageMs(run.startedAt) > 7 * 24 * 3600_000) return null;
  return {
    startedAt: run.startedAt,
    // the run creates its cars between these two moments
    until: new Date((run.finishedAt ?? run.startedAt).getTime() + 60_000),
  };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === (sp.status ?? "")) ?? TABS[0];
  const q = (sp.q ?? "").trim();
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : "new";

  const search: Prisma.CarWhereInput = q
    ? {
        OR: [
          ...q.split(/\s+/).map((w) => ({
            OR: [
              { brand: { contains: w, mode: "insensitive" as const } },
              { model: { contains: w, mode: "insensitive" as const } },
            ],
          })),
          { advert: { advertId: q.replace(/^#/, "") } },
          ...(/^\d{4}$/.test(q) ? [{ year: Number(q) }] : []),
        ],
      }
    : {};

  const [cars, counts, lastRun, fresh, week] = await Promise.all([
    prisma.car.findMany({
      where: { AND: [tab.where, search] },
      orderBy: SORTS[sort].orderBy,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        advert: true,
      },
    }),
    prisma.car.groupBy({ by: ["status"], _count: true }),
    lastImportRun(),
    lastImportWithNewCars(),
    prisma.car.count({
      where: {
        status: "PUBLISHED",
        createdAt: { gt: daysAgo(7) },
      },
    }),
  ]);

  // keep the site fresh: when the panel is opened and the last successful
  // import is older than 6 hours, run one in the background (needs the key)
  if (nnnConfigured() && (await importIsStale(6))) {
    after(() => importFrom999("auto").catch(() => {}));
  }

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const tabCount = (key: string) =>
    key === ""
      ? ACTIVE.reduce((a, s) => a + countFor(s), 0)
      : key === "all"
        ? counts.reduce((a, c) => a + c._count, 0)
        : countFor(key);

  const rows: AdminCar[] = cars.map((c) => ({
    id: c.id,
    slug: c.slug,
    brand: c.brand,
    model: c.model,
    year: c.year,
    price: c.price,
    oldPrice: c.oldPrice,
    mileage: c.mileage,
    fuel: c.fuel,
    transmission: c.transmission,
    engineCc: c.engineCc,
    status: c.status,
    featured: c.featured,
    image: c.images[0]?.path ?? null,
    createdAt: c.createdAt.toISOString(),
    advert: c.advert
      ? {
          advertId: c.advert.advertId,
          source: c.advert.source,
          state: c.advert.state,
          nnnState: c.advert.nnnState,
          lastError: c.advert.lastError,
          views: c.advert.views,
          expiresAt: c.advert.expiresAt?.toISOString() ?? null,
          importedAt: c.advert.createdAt.toISOString(),
        }
      : null,
  }));

  // Chronological view: the cars of the last import that brought new ones
  // get their own block on top, the rest are grouped by the day they appeared
  const chrono = sort === "new" && !q;
  const isFresh = (r: AdminCar) =>
    !!fresh &&
    r.advert?.source === "nnn" &&
    new Date(r.advert.importedAt) >= fresh.startedAt &&
    new Date(r.advert.importedAt) <= fresh.until;
  const freshRows = chrono ? rows.filter(isFresh) : [];
  const restRows = chrono ? rows.filter((r) => !isFresh(r)) : rows;

  const groups: { key: string; label: string; rows: AdminCar[] }[] = [];
  if (chrono) {
    for (const r of restRows) {
      const key = dayKey(r.createdAt);
      const last = groups[groups.length - 1];
      if (last?.key === key) last.rows.push(r);
      else groups.push({ key, label: dayLabel(r.createdAt), rows: [r] });
    }
  }

  const href = (p: { status?: string; q?: string; sort?: string }) => {
    const u = new URLSearchParams();
    const status = p.status ?? tab.key;
    const qq = p.q ?? q;
    const s = p.sort ?? sort;
    if (status) u.set("status", status);
    if (qq) u.set("q", qq);
    if (s !== "new") u.set("sort", s);
    const str = u.toString();
    return str ? `/admin?${str}` : "/admin";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Mașinile din parcare
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Tot ce e aici apare pe inauto.md. Mașinile postate pe 999.md vin singure;
            cele adăugate de mână le publici tu.
          </p>
        </div>
        <Link href="/admin/cars/new" className="btn-primary h-11 px-5">
          + Adaugă o mașină
        </Link>
      </div>

      {/* the numbers the dealer asks about first */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { v: countFor("PUBLISHED"), l: "pe site acum", href: href({ status: "PUBLISHED" }) },
          { v: week, l: "noi în ultimele 7 zile", href: "/admin" },
          { v: countFor("RESERVED"), l: "rezervate", href: href({ status: "RESERVED" }) },
          { v: countFor("SOLD"), l: "vândute (marcate de tine)", href: href({ status: "SOLD" }) },
        ].map((s) => (
          <Link
            key={s.l}
            href={s.href}
            className="rounded-xl border border-line bg-card px-4 py-3.5 transition-colors hover:border-ink-faint"
          >
            <dd className="font-display text-2xl font-extrabold tabular-nums">{s.v}</dd>
            <dt className="mt-0.5 text-[13px] text-ink-soft">{s.l}</dt>
          </Link>
        ))}
      </dl>

      <NnnImportPanel
        mode={nnnMode()}
        lastRun={
          lastRun
            ? {
                when: fmtDateTime(lastRun.startedAt),
                // an unfinished run younger than 10 min is still going
                running: !lastRun.finishedAt && ageMs(lastRun.startedAt) < 10 * 60_000,
                ok: lastRun.ok,
                trigger: lastRun.trigger,
                summary: lastRun.summary,
                error: lastRun.error,
                details: lastRun.details,
              }
            : null
        }
      />

      {/* toolbar: status tabs, search, sort */}
      <div className="space-y-3">
        <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {TABS.map((t) => (
            <Link
              key={t.key || "active"}
              href={href({ status: t.key })}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${
                t.key === tab.key ? "chip-dark" : "chip-3d text-ink-soft"
              }`}
            >
              {t.label}{" "}
              <span className={t.key === tab.key ? "text-white/70" : "text-ink-faint"}>
                {tabCount(t.key)}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <form action="/admin" className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
            {tab.key && <input type="hidden" name="status" value={tab.key} />}
            {sort !== "new" && <input type="hidden" name="sort" value={sort} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Caută: marcă, model, an sau nr. anunț 999"
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-card px-3.5 text-sm outline-none focus:border-ink"
            />
            <button type="submit" className="btn-dark h-11 px-4 text-[13px]">
              Caută
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="mr-1 text-ink-faint">Ordine:</span>
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <Link
                key={k}
                href={href({ sort: k })}
                className={`rounded-lg px-2.5 py-1.5 font-semibold ${
                  k === sort ? "chip-dark" : "chip-3d text-ink-soft"
                }`}
              >
                {SORTS[k].label}
              </Link>
            ))}
          </div>
        </div>
        {q && (
          <p className="text-sm text-ink-soft">
            {cars.length} rezultate pentru „{q}” ·{" "}
            <Link href={href({ q: "" })} className="font-semibold text-accent hover:underline">
              șterge căutarea
            </Link>
          </p>
        )}
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center text-ink-soft">
          Nicio mașină aici.{" "}
          <Link href="/admin/cars/new" className="font-semibold text-accent">
            Adaugă una →
          </Link>
        </div>
      )}

      {freshRows.length > 0 && fresh && (
        <section className="overflow-hidden rounded-2xl border-2 border-accent/60 bg-card">
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-accent-soft px-4 py-3 sm:px-5">
            <h2 className="font-display text-base font-extrabold">
              Noi la ultimul import · {freshRows.length}{" "}
              {freshRows.length === 1 ? "mașină" : "mașini"}
            </h2>
            <span className="text-[13px] text-ink-soft">
              aduse de pe 999.md {fmtDateTime(fresh.startedAt)}
            </span>
          </header>
          <ul className="divide-y divide-line">
            {freshRows.map((r) => (
              <AdminCarRow key={r.id} car={r} />
            ))}
          </ul>
        </section>
      )}

      {chrono
        ? groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 flex items-center gap-3 text-[13px] font-semibold text-ink-soft">
                <span className="shrink-0">{g.label}</span>
                <span className="text-ink-faint">{g.rows.length}</span>
                <span className="h-px flex-1 bg-line" />
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {g.rows.map((r) => (
                  <AdminCarRow key={r.id} car={r} />
                ))}
              </ul>
            </section>
          ))
        : restRows.length > 0 && (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {restRows.map((r) => (
                <AdminCarRow key={r.id} car={r} />
              ))}
            </ul>
          )}
    </div>
  );
}
