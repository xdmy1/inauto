import { NextRequest, NextResponse } from "next/server";
import { cachedCar } from "@/lib/cache";
import { filtersToWhere, parseFilters } from "@/lib/cars";

// live counter for the interactive search card
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const filters = parseFilters(params);
  const count = await cachedCar.count({ where: filtersToWhere(filters) });
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } }
  );
}
