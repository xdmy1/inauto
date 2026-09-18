"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, ShareIcon } from "./icons";

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("car");
  const [done, setDone] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="chip-3d inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold text-ink-soft hover:text-ink"
    >
      {done ? <CheckIcon className="h-4 w-4 text-ok" /> : <ShareIcon className="h-4 w-4" />}
      {done ? t("copied") : t("share")}
    </button>
  );
}
