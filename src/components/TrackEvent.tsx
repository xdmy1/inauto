"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Fires one GA4 event when a page mounts (view_item on a car, view_item_list
// on the catalogue…). Waits a moment so gtag has loaded.
export function TrackEvent({ event, params }: { event: string; params: Record<string, unknown> }) {
  const key = JSON.stringify([event, params]);
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      if (window.gtag || ++tries > 20) {
        window.clearInterval(id);
        track(event, params as Parameters<typeof track>[1]);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
