import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ro", "ru"],
  defaultLocale: "ro",
  // Romanian lives at "/", Russian at "/ru" — best for the local market + SEO
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
