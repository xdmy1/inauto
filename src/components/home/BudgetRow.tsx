import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "../icons";

// The three price bands as one card: three cells split by hairlines (rows
// on phones, columns from sm up), the range set in display type, the live
// count beneath it and a small arrow that answers hover. Quiet on purpose:
// it sits under the body-type tiles and should read as the same family.
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
    <div
      data-reveal
      className="card grid grid-cols-1 divide-y divide-line overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      {budgets.map((b) => (
        <Link
          key={b.key}
          href={`/auto?${b.query}`}
          className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-paper sm:px-6 sm:py-5"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-[16px] font-extrabold leading-tight tracking-tight text-ink sm:text-[18px]">
              {labels[b.key]}
            </span>
            <span className="text-[12.5px] leading-snug text-ink-faint tabular-nums">
              {t("common.cars", { count: b.count })}
            </span>
          </span>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
        </Link>
      ))}
    </div>
  );
}
