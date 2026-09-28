import { getTranslations } from "next-intl/server";
import { Odometer } from "../motion/Odometer";

// The dealership's numbers — every figure is a real claim from the client's
// own site (7/7 open, down payment from 100 €, verified mileage), never invented.
// The digits are odometer drums that roll into place the first time they show.
export async function StatsStrip({ count }: { count: number }) {
  const t = await getTranslations("home");
  const stats = [
    { value: String(count), label: t("statsCars") },
    { value: "100 €", label: t("statsDown") },
    { value: "7/7", label: t("statsDays") },
    { value: "100%", label: t("statsVerified") },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} data-reveal className="stat-tile">
          <strong>
            <Odometer value={s.value} />
          </strong>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
