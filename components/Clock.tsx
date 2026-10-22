"use client";

import { useSyncExternalStore } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};

// Poznań time, like the homepage taskbar.
export function Clock() {
  const now = useSyncExternalStore(subscribe, () => fmt.format(Math.floor(Date.now() / 1000) * 1000), () => "--:--:--");
  return <span className="clock" title="Poznań, CET">{now}</span>;
}
