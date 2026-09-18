"use client";

// Live "open now / closed" badge on the ticker bar, on Chișinău time.
// Mo–Fr 9–19, Sa 9–16, Su 10–14 (site.hours).
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const OPEN_BY_DAY = [10, 9, 9, 9, 9, 9, 9]; // Sun..Sat
const CLOSE_BY_DAY = [14, 19, 19, 19, 19, 19, 16]; // Sun..Sat

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
      const open_ = OPEN_BY_DAY[now.getDay()];
      const close = CLOSE_BY_DAY[now.getDay()];
      const h = now.getHours() + now.getMinutes() / 60;
      const open = h >= open_ && h < close;
      setState({
        open,
        time: open ? `${close}:00` : `${open_}:00`,
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
