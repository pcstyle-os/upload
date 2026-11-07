"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return <button type="button" className="lnk" aria-live="polite" onClick={async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("copy this link", url);
    }
  }}>{copied ? "copied" : "copy link"}</button>;
}
