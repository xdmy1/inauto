"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, ShareIcon } from "./icons";
import { track } from "@/lib/analytics";

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("car");
  const [done, setDone] = useState(false);

  async function share() {
    const url = window.location.href;
    const item_id = window.location.pathname.split("/").pop();
    try {
      if (navigator.share) {
        track("share", { method: "share_sheet", content_type: "car", item_id, area: "car_page" });
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      track("share", { method: "copy_link", content_type: "car", item_id, area: "car_page" });
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
