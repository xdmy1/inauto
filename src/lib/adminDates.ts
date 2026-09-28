// Dates in the admin, always in Chișinău time (the server runs in UTC)
const TZ = "Europe/Chisinau";

/** YYYY-MM-DD in Chișinău */
export function dayKey(d: Date | string | number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));
}

const DAY = 24 * 3600_000;

/** "Azi", "Ieri", "Joi, 24 septembrie", "12 martie 2025" */
export function dayLabel(d: Date | string | number) {
  const date = new Date(d);
  const key = dayKey(date);
  const now = Date.now();
  if (key === dayKey(now)) return "Azi";
  if (key === dayKey(now - DAY)) return "Ieri";
  const sameYear = key.slice(0, 4) === dayKey(now).slice(0, 4);
  const withinWeek = now - date.getTime() < 6 * DAY;
  const s = new Intl.DateTimeFormat("ro-RO", {
    timeZone: TZ,
    weekday: withinWeek ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "azi la 09:50", "ieri la 18:21", "24 septembrie la 17:02" */
export function fmtDateTime(d: Date | string) {
  const date = new Date(d);
  const time = new Intl.DateTimeFormat("ro-RO", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const label = dayLabel(date);
  const day = label === "Azi" || label === "Ieri" ? label.toLowerCase() : label.replace(/^[^,]+, /, "").toLowerCase();
  return `${day} la ${time}`;
}

/** "în 12 zile", "mâine", "azi", "expirat" */
export function daysLeft(d: Date | string) {
  const n = Math.ceil((new Date(d).getTime() - Date.now()) / DAY);
  if (n < 0) return "expirat";
  if (n === 0) return "azi";
  if (n === 1) return "mâine";
  return `în ${n} ${n < 20 ? "zile" : "de zile"}`;
}

/** how long ago, in ms */
export function ageMs(d: Date | string) {
  return Date.now() - new Date(d).getTime();
}

/** the moment `days` days ago */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY);
}
