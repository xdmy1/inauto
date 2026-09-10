import { NextResponse } from "next/server";

// TEMPORARY: env variable NAMES only (no values) — removed after diagnosis
export async function GET() {
  const names = Object.keys(process.env)
    .filter((k) => /DATABASE|POSTGRES|PGHOST|PGUSER|NEON|BLOB|STORAGE/i.test(k))
    .sort();
  return NextResponse.json({ names });
}
