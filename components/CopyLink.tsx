"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return <>
    <button type="button" className="lnk" onClick={async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("copy this link", url);
      }
    }}>{copied ? "copied" : "copy link"}</button>
    <span role="status" className="sr-only">{copied ? "link copied" : ""}</span>
  </>;
}
