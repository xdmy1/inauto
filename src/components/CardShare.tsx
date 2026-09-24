"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "./icons";

// "Expediază" in the top-right corner of every car card: the phone's share
// sheet where there is one, otherwise the link goes to the clipboard.
// Lives inside the card's link, so it stops the click from opening the car.
export function CardShare({
  path,
  title,
  labels,
}: {
  /** locale-prefixed path of the car page, e.g. "/ru/auto/bmw-x3-2020" */
  path: string;
  title: string;
  labels: { share: string; copied: string };
}) {
  const [done, setDone] = useState(false);

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${path}`;
    // the share sheet only where it is a real one (touch devices); desktops copy the link
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (touch && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard blocked — nothing to show */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={labels.share}
      className="photo-badge photo-badge-white absolute right-2.5 top-2.5 h-7 gap-1.5 px-2.5 normal-case tracking-normal transition-colors hover:bg-white"
    >
      {done ? <CheckIcon className="h-3.5 w-3.5 text-ok" /> : <ShareIcon className="h-3.5 w-3.5" />}
      {done ? labels.copied : labels.share}
    </button>
  );
}
