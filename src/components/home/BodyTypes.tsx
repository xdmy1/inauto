import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MINIBUS, MINIBUS_BODIES } from "@/lib/cars";
import { BODY_ICONS } from "../bodyIcons";

const ORDER = ["suv", "sedan", "wagon", "hatchback", "minivan", "coupe", "pickup", "cabrio"] as const;

export async function BodyTypes({
  counts,
}: {
  counts: { body: string; count: number }[];
}) {
  const t = await getTranslations();
  const map = new Map(counts.map((c) => [c.body, c.count]));
  // minivan + van are shown as a single "Microbuze" tile
  const minibus = MINIBUS_BODIES.reduce((n, b) => n + (map.get(b) ?? 0), 0);
  const rows: { key: string; href: string; icon: keyof typeof BODY_ICONS; label: string; count: number }[] =
    ORDER.filter((b) => b !== "minivan" && (map.get(b) ?? 0) > 0).map((b) => ({
      key: b,
      href: `/auto?body=${b}`,
      icon: b,
      label: t(`options.body.${b}`),
      count: map.get(b) ?? 0,
    }));
  if (minibus > 0)
    rows.splice(Math.min(4, rows.length), 0, {
      key: "minibus",
      href: `/auto?body=${MINIBUS}`,
      icon: "minivan",
      label: t("options.body.minibus"),
      count: minibus,
    });
  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {rows.map((row) => {
        const Icon = BODY_ICONS[row.icon];
        return (
          <Link key={row.key} href={row.href} data-reveal className="body-tile">
            <Icon className="h-8 w-[76px]" />
            <span className="text-[13px] font-bold text-ink">{row.label}</span>
            <span className="-mt-1 text-[11.5px] text-ink-faint">
              {t("common.cars", { count: row.count })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
