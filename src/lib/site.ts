// Static business data for INAUTO — single source of truth
export const site = {
  name: "INAUTO.MD",
  legalName: "INAUTO",
  domain: "inauto.md",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://inauto.md",
  address: {
    street: "str. Cucorilor 14",
    city: "Chișinău",
    country: "MD",
    full: "mun. Chișinău, str. Cucorilor 14",
  },
  // international format, no "+"
  phones: ["37368501002", "37368555226", "37368555227"],
  phoneDisplay: ["068 501 002", "068 555 226", "068 555 227"],
  whatsapp: "37368501002",
  email: "office@inauto.md",
  hours: [
    { days: "Mo-Fr", open: "09:00", close: "18:00" },
    { days: "Sa", open: "09:00", close: "15:00" },
    { days: "Su", open: "09:00", close: "13:00" },
  ],
  geo: { lat: 47.0105, lon: 28.8638 },
  social: {
    facebook: "https://www.facebook.com/inauto.md",
    instagram: "https://www.instagram.com/inauto.md",
  },
} as const;

export function telHref(phone: string) {
  return `tel:+${phone}`;
}

export function waHref(phone: string, text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${q}`;
}
