// Client-safe image URL helper (no node deps)
export function imageUrl(basePath: string, size: "sm" | "lg") {
  return `/uploads/${basePath}-${size}.webp`;
}
