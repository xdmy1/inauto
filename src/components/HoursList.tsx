"use client";

// Opening hours with today's row picked out, on Chișinău time.
import { useEffect, useState } from "react";

export function HoursList({
  rows,
  todayLabel,
}: {
  /** days: 0 = Sunday … 6 = Saturday */
  rows: { label: string; hours: string; days: number[] }[];
  todayLabel: string;
}) {
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    const tick = () =>
      setToday(
        new Date(
          new Date().toLocaleString("en-US", { timeZone: "Europe/Chisinau" })
        ).getDay()
      );
    tick();
    const id = window.setInterval(tick, 10 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const isToday = today != null && r.days.includes(today);
        return (
          <li
            key={r.label}
            className={`flex items-baseline justify-between gap-4 text-[15px] transition-colors ${
              isToday ? "font-medium text-white" : "font-light text-white/55"
            }`}
          >
            <span>
              {r.label}
              {isToday && (
                <span className="ml-2 text-xs font-normal text-white/45">
                  {todayLabel}
                </span>
              )}
            </span>
            <span className="shrink-0 whitespace-nowrap tabular-nums">{r.hours}</span>
          </li>
        );
      })}
    </ul>
  );
}
