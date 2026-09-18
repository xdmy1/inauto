"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Select } from "./ui/Select";

const SORTS = ["new", "price_asc", "price_desc", "year_desc", "mileage_asc"] as const;

function Inner({ value }: { value: string }) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function change(next: string) {
    const q = new URLSearchParams(sp.toString());
    q.delete("page");
    if (next && next !== "new") q.set("sort", next);
    else q.delete("sort");
    router.push(`${pathname}${q.size ? `?${q}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden text-xs font-semibold text-ink-faint sm:block">{t("sortBy")}</span>
      <Select
        value={value === "new" ? "" : value}
        onChange={change}
        placeholder={t("sort.new")}
        options={SORTS.filter((s) => s !== "new").map((s) => ({
          value: s,
          label: t(`sort.${s}`),
        }))}
        className="w-[210px]"
      />
    </div>
  );
}

export function SortSelect({ value }: { value: string }) {
  return (
    <Suspense fallback={<div className="h-11 w-[210px]" />}>
      <Inner value={value} />
    </Suspense>
  );
}
