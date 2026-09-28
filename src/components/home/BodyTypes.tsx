import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MINIBUS, MINIBUS_BODIES } from "@/lib/cars";

// One real car from the lot for every body type, cut out and photographed
// on a light studio floor inside its card; the last tile is the whole lot.
const ORDER = ["suv", "sedan", "wagon", "hatchback", "minibus", "coupe", "pickup"] as const;

export async function BodyTypes({
  counts,
}: {
  counts: { body: string; count: number }[];
}) {
  const t = await getTranslations();
  const map = new Map(counts.map((c) => [c.body, c.count]));
  // minivan + van are shown as a single "Microbuze" tile
  const minibus = MINIBUS_BODIES.reduce((n, b) => n + (map.get(b) ?? 0), 0);
  const total = counts.reduce((n, c) => n + c.count, 0);

  const tiles: { key: string; href: string; label: string; count: number }[] = ORDER.map((key) => ({
    key,
    href: key === "minibus" ? `/auto?body=${MINIBUS}` : `/auto?body=${key}`,
    label: t(`options.body.${key}`),
    count: key === "minibus" ? minibus : (map.get(key) ?? 0),
  })).filter((r) => r.count > 0);
  tiles.push({ key: "all", href: "/auto", label: t("home.allCars"), count: total });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {tiles.map((tile, i) => (
        <Link
          key={tile.key}
          href={tile.href}
          data-reveal
          className={tile.key === "all" ? "body-card body-card-all" : "body-card"}
        >
          <span className="body-card-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/body/${tile.key}.webp`}
              alt=""
              width={640}
              height={460}
              loading={i < 4 ? "eager" : "lazy"}
              decoding="async"
            />
          </span>
          <span className="body-card-text">
            <span className="body-card-name">{tile.label}</span>
            <span className="body-card-count">{t("common.cars", { count: tile.count })}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
