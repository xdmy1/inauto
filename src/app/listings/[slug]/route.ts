import { NextRequest } from "next/server";
import { legacyCarRedirect } from "@/lib/legacy";

// old inauto.md (WordPress, until 2022): /listings/<slug>/ → 301 to what replaced it
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  return legacyCarRedirect(req, slug);
}
