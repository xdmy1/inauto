import { BRAND_LOGO_SLUGS } from "./brandLogos.generated";

// Brand logos (in colour) for the brand tiles — public/images/brands/<slug>.webp,
// from the car-logos-dataset (MIT); the marks themselves are the makers' trademarks.
// A brand without a file shows as text. To add one: drop <slug>.webp in the
// folder and re-run the download script (README « Logo-urile mărcilor »).
export function brandLogoSlug(brand: string) {
  return brand
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "/images/brands/bmw.webp" when we have the logo, else null */
export function brandLogo(brand: string): string | null {
  const slug = brandLogoSlug(brand);
  return BRAND_LOGO_SLUGS.has(slug) ? `/images/brands/${slug}.webp` : null;
}
