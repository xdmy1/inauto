// Google Analytics 4 (gtag.js) — the measurement id and one typed helper.
// Every call is a no-op until gtag is on the page (server render, blocked by
// an ad blocker, or a host that is not inauto.md), so it is safe anywhere.

export const GA_ID = "G-M1VNTHJ3YE";

type Params = Record<string, string | number | boolean | undefined | null | object[]>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  const clean: Params = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") clean[k] = v;
  window.gtag("event", event, clean);
}

/** a car as a GA4 ecommerce item */
export function carItem(c: {
  id: string;
  brand: string;
  model: string;
  year?: number;
  price?: number;
  body?: string;
  fuel?: string;
  index?: number;
  list?: string;
}) {
  return {
    item_id: c.id,
    item_name: `${c.brand} ${c.model}${c.year ? ` ${c.year}` : ""}`,
    item_brand: c.brand,
    item_category: c.body,
    item_category2: c.fuel,
    item_variant: c.year ? String(c.year) : undefined,
    price: c.price,
    index: c.index,
    item_list_name: c.list,
    quantity: 1,
  };
}
