"use client";

import { useEffect, useState } from "react";
import type { PreviewKind } from "@/lib/files";
import { Pix } from "./Pix";
import { Player } from "./Player";

export function FilePreview({ kind, source, name, failed: loadFailed = false }: {
  kind: PreviewKind;
  source: string;
  name: string;
  failed?: boolean;
}) {
  const [failed, setFailed] = useState(loadFailed);

  // An iframe can't report HTTP errors, so check the html route first.
  useEffect(() => {
    if (kind !== "html") return;
    const abort = new AbortController();
    fetch(source, { headers: { Range: "bytes=0-0" }, signal: abort.signal })
      .then(res => { if (!res.ok) setFailed(true); return res.body?.cancel(); })
      .catch(() => { if (!abort.signal.aborted) setFailed(true); });
    return () => abort.abort();
  }, [kind, source]);

  if (failed || kind === "other" || kind === "text") {
    return <div className="preview empty">
      <Pix name="file" className="tile" />
      <p>{failed ? "the preview didn’t load." : "no preview for this file type."}</p>
      <p className="hint">use the download button above to save it.</p>
    </div>;
  }

  if (kind === "html") {
    return <iframe
      title={`preview of ${name}`}
      src={source}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className="preview html"
    />;
  }

  if (kind === "pdf") {
    return <object data={source} type="application/pdf" className="preview" aria-label={`preview of ${name}`}>
      <div className="preview empty">
        <Pix name="file" className="tile" />
        <p>this browser can’t show pdfs inline.</p>
        <p className="hint">use download or open original.</p>
      </div>
    </object>;
  }

  if (kind === "video" || kind === "audio") {
    return <Player kind={kind} src={source} name={name} onError={() => setFailed(true)} />;
  }

  return <div className="preview pic">
    {/* eslint-disable-next-line @next/next/no-img-element -- intrinsic size, straight from the CDN */}
    <img src={source} alt={name} loading="eager" fetchPriority="high" onError={() => setFailed(true)} />
  </div>;
}
