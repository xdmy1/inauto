// Client-safe image URL helper (no node deps).
// path is either a disk basePath ("cars/<id>/<name>") or a JSON string
// {"lg":url,"sm":url} when the image lives in Vercel Blob or on the 999.md CDN.
export function imageUrl(basePath: string, size: "sm" | "md" | "lg") {
  if (basePath.startsWith("{")) {
    try {
      const parsed = JSON.parse(basePath) as { lg: string; sm: string };
      // the 999.md CDN also serves a 640x480 cut — right for cards on retina
      if (size === "md") return parsed.lg.replace("/BoardImages/900x900/", "/BoardImages/640x480/");
      return parsed[size];
    } catch {
      return "";
    }
  }
  return `/uploads/${basePath}-${size === "md" ? "lg" : size}.webp`;
}

/** srcset covering every cut we have, so the browser picks by real pixel width */
export function imageSrcSet(basePath: string) {
  const sm = imageUrl(basePath, "sm");
  const md = imageUrl(basePath, "md");
  const lg = imageUrl(basePath, "lg");
  return md === lg ? `${sm} 400w, ${lg} 1600w` : `${sm} 320w, ${md} 640w, ${lg} 1280w`;
}
