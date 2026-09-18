import { NextRequest, NextResponse } from "next/server";
import { importFrom999 } from "@/lib/nnn/import";

// Scheduled import from 999.md (vercel.json → crons). Vercel calls this with
// "Authorization: Bearer <CRON_SECRET>"; the same header lets you trigger it
// from anywhere else (curl, another cron) once CRON_SECRET is set.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await importFrom999("cron");
  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
    headers: { "Cache-Control": "no-store" },
  });
}
