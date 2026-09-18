import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BODY_ICONS } from "../bodyIcons";

const ORDER = ["suv", "sedan", "wagon", "hatchback", "minivan", "coupe", "pickup", "van", "cabrio"] as const;

export async function BodyTypes({
  counts,
}: {
  counts: { body: string; count: number }[];
}) {
  const t = await getTranslations();
  const map = new Map(counts.map((c) => [c.body, c.count]));
  const rows = ORDER.filter((b) => (map.get(b) ?? 0) > 0);
  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {rows.map((b) => {
        const Icon = BODY_ICONS[b];
        return (
          <Link key={b} href={`/auto?body=${b}`} data-reveal className="body-tile">
            <Icon className="h-8 w-[76px]" />
            <span className="text-[13px] font-bold text-ink">{t(`options.body.${b}`)}</span>
            <span className="-mt-1 text-[11.5px] text-ink-faint">
              {t("common.cars", { count: map.get(b) ?? 0 })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
