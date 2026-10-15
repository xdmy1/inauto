import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// The public site reads the stock through this cache instead of hitting
// Neon on every request: a page view (or a bot crawl, or a link prefetch)
// used to run ~10 queries, which kept the database awake 24/7 and burned
// through the plan's compute quota (the whole site went down on 2026-10-15).
// Entries live in the Next.js data cache (shared across instances and
// deployments). Any write to the stock calls invalidateCars(); the hourly
// revalidate is only a safety net. While a refresh fails (database down),
// the last good result keeps being served instead of a 500.

export const CARS_TAG = "cars";

const run = unstable_cache(
  async (op: CarOp, args: unknown) =>
    (prisma.car as unknown as Record<CarOp, (a: unknown) => Promise<unknown>>)[op](args),
  ["car-query-v1"],
  { tags: [CARS_TAG], revalidate: 3600 }
);

type CarOp = "count" | "findMany" | "findFirst" | "groupBy";

// cache hits come back JSON-parsed, so Dates are ISO strings again
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function reviveDates(value: unknown): unknown {
  if (typeof value === "string") return ISO_DATE.test(value) ? new Date(value) : value;
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, reviveDates(v)])
    );
  }
  return value;
}

function cachedOp<K extends CarOp>(op: K): (typeof prisma.car)[K] {
  return (async (args: unknown) => reviveDates(await run(op, args))) as unknown as (typeof prisma.car)[K];
}

/** the read side of prisma.car, cached — same signatures */
export const cachedCar = {
  count: cachedOp("count"),
  findMany: cachedOp("findMany"),
  findFirst: cachedOp("findFirst"),
  groupBy: cachedOp("groupBy"),
};
