"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { GA_ID, carItem, track } from "@/lib/analytics";

// GA4 for the public site, plus one delegated listener that turns every
// meaningful tap into an event, so nothing has to be wired button by button:
//  - phone / WhatsApp / e-mail / maps / Waze links  → generate_lead + contact_click
//  - a car card (anything with data-item-id)         → select_item (ecommerce)
//  - every other link or button                      → ui_click {label, area, target}
//  - sections seen for the first time                → section_view {section}
//  - how far down the page people get                → scroll_depth 25/50/75/100
// Only inauto.md reports (no localhost / preview noise); add ?ga_debug=1 to
// any URL to send from anywhere with GA's DebugView switched on.
export function Analytics() {
  const mode = useSyncExternalStore(noSubscribe, clientMode, () => "off" as Mode);
  const on = mode === "off" ? null : { debug: mode === "debug" };

  useEffect(() => {
    if (!on) return;

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a, button, [role=button], [role=option]");
      if (!el) return;
      const a = el.closest("a");
      const href = a?.getAttribute("href") ?? "";
      const area = areaOf(el);
      const label = labelOf(el);

      // contact — the leads that matter most
      const contact = contactOf(href);
      if (contact) {
        const car = carContext();
        track("generate_lead", { method: contact, area, ...car });
        track("contact_click", { method: contact, area, label, ...car });
        return;
      }

      // a car picked from a list
      const card = el.closest<HTMLElement>("[data-item-id]");
      if (card && a && el === a) {
        const d = card.dataset;
        const list = listName(card);
        track("select_item", {
          item_list_name: list,
          items: [
            carItem({
              id: d.itemId!,
              brand: d.itemBrand ?? "",
              model: d.itemModel ?? "",
              year: Number(d.itemYear) || undefined,
              price: Number(d.itemPrice) || undefined,
              body: d.itemBody,
              fuel: d.itemFuel,
              index: indexIn(card),
              list,
            }),
          ],
        });
        return;
      }

      track("ui_click", {
        label,
        area,
        target: href || undefined,
        element: el.tagName.toLowerCase(),
        page_type: pageType(),
      });
    };
    document.addEventListener("click", onClick, { capture: true });

    // first sight of each titled section
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const name = sectionName(en.target);
          io.unobserve(en.target);
          if (!name || seen.has(name)) continue;
          seen.add(name);
          track("section_view", { section: name, page_type: pageType() });
        }
      },
      { threshold: 0.35 }
    );
    const watch = () => document.querySelectorAll("main section").forEach((s) => io.observe(s));
    watch();

    // scroll depth, once per step per page
    let marks = new Set<number>();
    let path = location.pathname;
    const onScroll = () => {
      if (location.pathname !== path) {
        path = location.pathname;
        marks = new Set();
        seen.clear();
        watch();
      }
      const h = document.documentElement.scrollHeight - innerHeight;
      if (h < 200) return;
      const pct = (scrollY / h) * 100;
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m - 1 && !marks.has(m)) {
          marks.add(m);
          track("scroll_depth", { percent: m, page_type: pageType() });
        }
      }
    };
    addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      removeEventListener("scroll", onScroll);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (!on) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{site_locale:document.documentElement.lang${on.debug ? ",debug_mode:true" : ""}});`}
      </Script>
    </>
  );
}

type Mode = "off" | "on" | "debug";
const noSubscribe = () => () => {};
function clientMode(): Mode {
  if (new URLSearchParams(location.search).has("ga_debug")) return "debug";
  return /(^|\.)inauto\.md$/.test(location.hostname) ? "on" : "off";
}

function contactOf(href: string) {
  if (href.startsWith("tel:")) return "phone";
  if (/wa\.me|whatsapp/i.test(href)) return "whatsapp";
  if (href.startsWith("mailto:")) return "email";
  if (/viber/i.test(href)) return "viber";
  if (/waze\.com/i.test(href)) return "waze";
  if (/google\.[^/]+\/maps|maps\.google|goo\.gl\/maps|maps\.app/i.test(href)) return "google_maps";
  if (/t\.me\//i.test(href)) return "telegram";
  return null;
}

function labelOf(el: Element) {
  const t =
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    (el as HTMLElement).innerText ||
    el.textContent ||
    "";
  return t.replace(/\s+/g, " ").trim().slice(0, 80) || undefined;
}

function areaOf(el: Element) {
  const marked = el.closest<HTMLElement>("[data-area]");
  if (marked) return marked.dataset.area;
  if (el.closest(".ticker")) return "ticker";
  if (el.closest("header, .site-header")) return "header";
  if (el.closest("[role=dialog], .drawer-panel")) return "menu";
  if (el.closest("footer")) return "footer";
  if (el.closest(".qs")) return "search";
  if (el.closest(".orbit")) return "orbit";
  if (el.closest(".hero")) return "hero";
  const s = el.closest("section");
  if (s) return sectionName(s) ?? "page";
  if (el.closest(".wa-fab, .fab-item")) return "floating_contact";
  return "page";
}

function sectionName(s: Element) {
  const h = s.querySelector("h1, h2");
  const t =
    (s as HTMLElement).dataset?.area ||
    ((h as HTMLElement | null)?.innerText || h?.textContent || "").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 60) : undefined;
}

function listName(card: Element) {
  const s = card.closest("section");
  return (s && sectionName(s)) || pageType();
}

function indexIn(card: Element) {
  const siblings = card.parentElement ? Array.from(card.parentElement.children) : [];
  const i = siblings.indexOf(card);
  return i >= 0 ? i : undefined;
}

function pageType() {
  const p = location.pathname.replace(/^\/ru(?=\/|$)/, "") || "/";
  if (p === "/") return "home";
  if (/^\/auto\/[^/]+/.test(p)) return "car";
  if (p.startsWith("/auto")) return "catalog";
  if (p.startsWith("/marca")) return "brand";
  if (p.startsWith("/contacte")) return "contact";
  if (p.startsWith("/despre")) return "about";
  return "other";
}

/** on a car page, which car a call / WhatsApp is about */
function carContext() {
  const el = document.querySelector<HTMLElement>("[data-car-page]");
  if (!el) return {};
  return { item_id: el.dataset.itemId, item_name: el.dataset.itemName, value: Number(el.dataset.itemPrice) || undefined, currency: "EUR" };
}
