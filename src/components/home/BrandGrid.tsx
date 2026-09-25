import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { brandSlug, type BrandCount } from "@/lib/cars";
import { brandLogo } from "@/lib/brandLogos";

// Every make in the lot as a tile: the logo in colour, the name, how many
// cars. Most cars first. A grid on wide screens, two swipeable rows on phones.
export async function BrandGrid({ brands }: { brands: BrandCount[] }) {
  const t = await getTranslations("common");
  if (brands.length === 0) return null;
  const sorted = [...brands].sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));

  return (
    <div className="brand-grid">
      {sorted.map((b) => {
        const logo = brandLogo(b.brand);
        return (
          <Link key={b.brand} href={`/marca/${brandSlug(b.brand)}`} data-reveal className="brand-tile">
            <span className="brand-tile-logo">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" width={110} height={72} loading="lazy" decoding="async" />
              ) : (
                <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                  {b.brand.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span className="truncate text-[13px] font-bold text-ink">{b.brand}</span>
            <span className="text-[11.5px] text-ink-faint">{t("cars", { count: b.count })}</span>
          </Link>
        );
      })}
    </div>
  );
}
