import { NextRequest, NextResponse } from "next/server";
import { readUpload } from "@/lib/uploads";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (rel.includes("..")) return new NextResponse(null, { status: 400 });

  const buf = await readUpload(rel);
  if (!buf) return new NextResponse(null, { status: 404 });

  const type = rel.endsWith(".webp")
    ? "image/webp"
    : rel.endsWith(".jpg") || rel.endsWith(".jpeg")
      ? "image/jpeg"
      : rel.endsWith(".png")
        ? "image/png"
        : "application/octet-stream";

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": type,
      // filenames are content-hashed at upload; safe to cache forever
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
