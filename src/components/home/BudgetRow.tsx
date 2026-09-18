import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "../icons";

export async function BudgetRow({
  budgets,
}: {
  budgets: { key: "under" | "mid" | "over"; query: string; count: number }[];
}) {
  const t = await getTranslations();
  const labels = {
    under: t("home.budgetUnder"),
    mid: t("home.budgetMid"),
    over: t("home.budgetOver"),
  };
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {budgets.map((b) => (
        <Link
          key={b.key}
          href={`/auto?${b.query}`}
          data-reveal
          className="card group flex items-center justify-between gap-3 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-ink-faint hover:shadow-lift"
        >
          <span>
            <span className="block font-display text-[15px] font-bold tracking-tight">
              {labels[b.key]}
            </span>
            <span className="mt-0.5 block text-xs text-ink-faint">
              {t("common.cars", { count: b.count })}
            </span>
          </span>
          <span className="chip-3d flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors group-hover:text-accent">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}
