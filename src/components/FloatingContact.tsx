"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { site, telHref, waHref } from "@/lib/site";
import {
  CloseIcon,
  ContactBubbleIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "./icons";

/**
 * Floating contact button: one tap opens two bubbles — phone and WhatsApp —
 * staggered upwards. Closes on outside click, Escape or after picking one.
 */
export function FloatingContact() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  function close() {
    setClosing((c) => {
      if (c) return c;
      closeTimer.current = window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 180);
      return true;
    });
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // top bubble first, so the phone one sits closest to the trigger
  const actions = [
    {
      key: "wa",
      href: waHref(site.whatsapp),
      label: t("whatsapp"),
      icon: <WhatsAppIcon className="h-4.5 w-4.5" />,
      tone: "btn-wa",
      external: true,
    },
    {
      key: "tel",
      href: telHref(site.phones[0]),
      label: site.phoneDisplay[0],
      icon: <PhoneIcon className="h-4.5 w-4.5" />,
      tone: "btn-call",
      external: false,
    },
  ];

  return (
    <div
      ref={rootRef}
      className="wa-fab group fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6"
    >
      {open &&
        actions.map((a, i) => (
          <a
            key={a.key}
            href={a.href}
            {...(a.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            onClick={close}
            style={{
              animationDelay: `${(closing ? actions.length - 1 - i : i) * 55}ms`,
            }}
            className={`fab-item ${closing ? "closing" : ""} ${a.tone} flex h-12 items-center gap-2.5 rounded-full py-0 pl-2.5 pr-4 text-white`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
              {a.icon}
            </span>
            <span className="whitespace-nowrap text-sm font-bold tabular-nums">
              {a.label}
            </span>
          </a>
        ))}

      {/* hint on desktop, only while collapsed */}
      {!open && (
        <div
          className="btn-call pointer-events-none absolute bottom-1/2 right-full mr-3.5 hidden h-auto w-max translate-x-2 translate-y-1/2 rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:flex"
          role="tooltip"
        >
          {t("contactHint")}
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? close() : (setClosing(false), setOpen(true)))}
        aria-expanded={open}
        aria-label={open ? t("close") : t("contactUs")}
        className="btn-call fab-trigger grid h-14 w-14 place-items-center rounded-full text-white"
      >
        <span className="relative grid h-7 w-7 place-items-center">
          <ContactBubbleIcon
            className={`fab-ico absolute h-7 w-7 ${open ? "is-out" : ""}`}
          />
          <CloseIcon
            className={`fab-ico absolute h-6 w-6 ${open ? "" : "is-out"}`}
          />
        </span>
      </button>
    </div>
  );
}
