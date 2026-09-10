"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";

function SwitcherInner() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTo(next: string) {
    const qs = searchParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { locale: next });
  }

  return (
    <div
      className="flex items-center rounded-full border border-line bg-card p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            l === locale
              ? "bg-ink text-paper"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={null}>
      <SwitcherInner />
    </Suspense>
  );
}
