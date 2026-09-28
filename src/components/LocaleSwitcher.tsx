"use client";

// RO | RU — two languages, so a plain toggle instead of a dropdown.
// Switches to the same page (and query) in the other language.
import { Fragment, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { ro: "Română", ru: "Русский" };

function SwitcherInner() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTo(next: string) {
    if (next === locale) return;
    const qs = searchParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { locale: next });
  }

  return (
    <div className="lang" role="group" aria-label={t("language")}>
      {routing.locales.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && <span className="lang-sep" aria-hidden />}
          <button
            type="button"
            lang={l}
            aria-pressed={l === locale}
            aria-label={LABELS[l] ?? l}
            onClick={() => switchTo(l)}
          >
            {l.toUpperCase()}
          </button>
        </Fragment>
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
