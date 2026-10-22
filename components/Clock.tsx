"use client";

import { useSyncExternalStore } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};

// Poznań time, like the homepage taskbar. The zone label follows DST (CET/CEST).
export function Clock() {
  const now = useSyncExternalStore(subscribe, () => fmt.format(Math.floor(Date.now() / 1000) * 1000), () => "--:--:--");
  const [time, zone = ""] = now.split(" ");
  return <span className="clock" title="Poznań time">{time} <span className="zone">{zone}</span></span>;
}
