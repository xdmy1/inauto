// Client-safe image URL helper (no node deps).
// path is either a disk basePath ("cars/<id>/<name>") or a JSON string
// {"lg":url,"sm":url} when the image lives in Vercel Blob.
export function imageUrl(basePath: string, size: "sm" | "lg") {
  if (basePath.startsWith("{")) {
    try {
      const parsed = JSON.parse(basePath) as { lg: string; sm: string };
      return parsed[size];
    } catch {
      return "";
    }
  }
  return `/uploads/${basePath}-${size}.webp`;
}
