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
    <span className="flex items-center gap-1.5 text-sm" aria-label="Language">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-line select-none" aria-hidden>
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={l === locale}
            className={`uppercase transition-colors ${
              l === locale
                ? "font-semibold text-ink"
                : "font-normal text-ink-faint hover:text-ink"
            }`}
          >
            {l}
          </button>
        </span>
      ))}
    </span>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={null}>
      <SwitcherInner />
    </Suspense>
  );
}
