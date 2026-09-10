import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import crypto from "node:crypto";
import { del, put } from "@vercel/blob";

// Car photos: on Vercel (BLOB_READ_WRITE_TOKEN set) they go to Vercel Blob;
// locally they live on disk under /uploads, served by the /uploads route.
// CarImage.path is either a conventional disk basePath ("cars/<id>/<name>")
// or a JSON string {"lg":url,"sm":url} for blob-hosted images.
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export type SavedImage = {
  basePath: string;
  width: number;
  height: number;
};

async function makeVariants(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const img = sharp(buf, { failOn: "none" }).rotate();

  const lg = await img
    .clone()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const sm = await img
    .clone()
    .resize({ width: 640, height: 480, fit: "cover", position: "attention" })
    .webp({ quality: 75 })
    .toBuffer();

  return { lg: lg.data, sm, width: lg.info.width, height: lg.info.height };
}

export async function saveCarImage(
  carId: string,
  file: File
): Promise<SavedImage> {
  const name = crypto.randomBytes(8).toString("hex");
  const { lg, sm, width, height } = await makeVariants(file);

  if (useBlob()) {
    const [lgBlob, smBlob] = await Promise.all([
      put(`cars/${carId}/${name}-lg.webp`, lg, {
        access: "public",
        contentType: "image/webp",
      }),
      put(`cars/${carId}/${name}-sm.webp`, sm, {
        access: "public",
        contentType: "image/webp",
      }),
    ]);
    return {
      basePath: JSON.stringify({ lg: lgBlob.url, sm: smBlob.url }),
      width,
      height,
    };
  }

  const dir = path.join(UPLOADS_DIR, "cars", carId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}-lg.webp`), lg);
  await fs.writeFile(path.join(dir, `${name}-sm.webp`), sm);
  return { basePath: `cars/${carId}/${name}`, width, height };
}

export async function deleteCarImageFiles(basePath: string) {
  if (basePath.startsWith("{")) {
    try {
      const { lg, sm } = JSON.parse(basePath) as { lg: string; sm: string };
      await del([lg, sm]).catch(() => {});
    } catch {
      /* malformed record — nothing to delete */
    }
    return;
  }
  for (const size of ["sm", "lg"] as const) {
    await fs
      .unlink(path.join(UPLOADS_DIR, `${basePath}-${size}.webp`))
      .catch(() => {});
  }
}

/** raw bytes of the large variant (for the 999.md upload) */
export async function readLargeImage(basePath: string): Promise<Buffer | null> {
  if (basePath.startsWith("{")) {
    try {
      const { lg } = JSON.parse(basePath) as { lg: string };
      const res = await fetch(lg);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
  return fs
    .readFile(path.join(UPLOADS_DIR, `${basePath}-lg.webp`))
    .catch(() => null);
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
