import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { brandSlug, type BrandCount } from "@/lib/cars";

// Brand chips with counts → SEO brand pages (/marca/bmw)
export async function BrandRow({
  brands,
  active,
  showAll = true,
  scope,
}: {
  brands: BrandCount[];
  active?: string;
  showAll?: boolean;
  /** query string of the active category, e.g. "body=minivan,van" — keeps
   *  the chips inside it instead of jumping to the brand page */
  scope?: string;
}) {
  const t = await getTranslations("common");
  if (brands.length === 0) return null;
  return (
    <div className="scroll-row">
      {showAll && (
        <Link
          href={scope ? `/auto?${scope}` : "/auto"}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${
            !active ? "chip-dark" : "chip-3d text-ink-soft hover:text-ink"
          }`}
        >
          {t("allBrands")}
        </Link>
      )}
      {brands.map((b) => (
        <Link
          key={b.brand}
          href={
            scope
              ? `/auto?${scope}&brand=${encodeURIComponent(b.brand)}`
              : `/marca/${brandSlug(b.brand)}`
          }
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${
            active === b.brand ? "chip-dark" : "chip-3d text-ink hover:text-accent"
          }`}
        >
          {b.brand}
          <span className={`ml-1.5 tabular-nums ${active === b.brand ? "text-white/60" : "text-ink-faint"}`}>
            {b.count}
          </span>
        </Link>
      ))}
    </div>
  );
}
