import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import crypto from "node:crypto";

// Uploads live outside /public so behavior is identical in dev and prod,
// served by src/app/uploads/[...path]/route.ts with immutable caching.
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export type SavedImage = {
  // stored in CarImage.path — base path without size suffix, e.g. "cars/abc/xyz"
  basePath: string;
  width: number;
  height: number;
};

export async function saveCarImage(
  carId: string,
  file: File
): Promise<SavedImage> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = crypto.randomBytes(8).toString("hex");
  const dir = path.join(UPLOADS_DIR, "cars", carId);
  await fs.mkdir(dir, { recursive: true });

  const img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();

  const lg = await img
    .clone()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(dir, `${name}-lg.webp`), lg.data);

  const sm = await img
    .clone()
    .resize({ width: 640, height: 480, fit: "cover", position: "attention" })
    .webp({ quality: 75 })
    .toBuffer();
  await fs.writeFile(path.join(dir, `${name}-sm.webp`), sm);

  return {
    basePath: `cars/${carId}/${name}`,
    width: lg.info.width ?? meta.width ?? 1600,
    height: lg.info.height ?? meta.height ?? 1200,
  };
}

export async function deleteCarImageFiles(basePath: string) {
  for (const size of ["sm", "lg"] as const) {
    await fs
      .unlink(path.join(UPLOADS_DIR, `${basePath}-${size}.webp`))
      .catch(() => {});
  }
}

export async function readUpload(relPath: string) {
  // prevent path traversal
  const full = path.join(UPLOADS_DIR, relPath);
  if (!full.startsWith(UPLOADS_DIR)) return null;
  try {
    return await fs.readFile(full);
  } catch {
    return null;
  }
}
