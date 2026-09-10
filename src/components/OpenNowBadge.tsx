"use client";

// Live "open now / closed" badge on the ticker bar, on Chișinău time.
// Mo–Fr 9–18, Sa 9–15, Su 9–13 (site.hours).
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const CLOSE_BY_DAY = [13, 18, 18, 18, 18, 18, 15]; // Sun..Sat
const OPEN_HOUR = 9;

function chisinauNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Chisinau" })
  );
}

export function OpenNowBadge() {
  const t = useTranslations("ticker");
  const [state, setState] = useState<{ open: boolean; time: string } | null>(
    null
  );

  useEffect(() => {
    const tick = () => {
      const now = chisinauNow();
      const close = CLOSE_BY_DAY[now.getDay()];
      const h = now.getHours() + now.getMinutes() / 60;
      const open = h >= OPEN_HOUR && h < close;
      setState({
        open,
        time: open ? `${close}:00` : `${OPEN_HOUR}:00`,
      });
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!state) return <span className="inline-block w-36" aria-hidden />;

  return (
    <span className="whitespace-nowrap text-[13.5px] font-light text-white/75">
      {t(state.open ? "open" : "closed", { time: state.time })}
    </span>
  );
}
