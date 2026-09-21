import { NextRequest } from "next/server";
import { legacyCarRedirect } from "@/lib/legacy";

// old inauto.md (2022–2025): /car/<slug> → 301 to what replaced it
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  return legacyCarRedirect(req, slug);
}
