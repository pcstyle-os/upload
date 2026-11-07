"use client";

import { useEffect, useRef, useState } from "react";
import { fit, room } from "./fit";
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
  const [loaded, setLoaded] = useState(false);

  // An iframe can't report HTTP errors, so check the html route first.
  useEffect(() => {
    if (kind !== "html") return;
    const abort = new AbortController();
    fetch(source, { headers: { Range: "bytes=0-0" }, signal: abort.signal })
      .then(res => { if (!res.ok) setFailed(true); return res.body?.cancel(); })
      .catch(() => { if (!abort.signal.aborted) setFailed(true); });
    return () => abort.abort();
  }, [kind, source]);

  if (failed || kind === "other" || kind === "text" || kind === "archive") {
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

  return <Picture source={source} name={name} loaded={loaded} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />;
}

function Picture({ source, name, loaded, onLoad, onError }: {
  source: string; name: string; loaded: boolean; onLoad: () => void; onError: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const i = img.current!, b = box.current!;
    // a cold load can finish (or fail) before hydration attaches the handlers
    if (i.complete) { if (i.naturalWidth) onLoad(); else onError(); }
    const size = () => {
      if (!i.naturalWidth) return;
      i.style.width = i.style.height = i.style.margin = "";
      const space = room(b, i);
      const [w, h] = fit(i.naturalWidth, i.naturalHeight, space);
      i.style.width = `${w}px`;
      i.style.height = `${h}px`;
      // centred with whole-pixel margins; on mobile it sits under the header
      const top = Number.isFinite(space[1]) && matchMedia("(min-width: 560px)").matches ? Math.floor((space[1] - h) / 2) : 0;
      i.style.margin = `${top}px 0 0 ${Math.floor((space[0] - w) / 2)}px`;
    };
    size();
    i.addEventListener("load", size);
    const ro = new ResizeObserver(size);
    ro.observe(b);
    return () => { i.removeEventListener("load", size); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-time wiring only
  }, []);

  return <div ref={box} className={loaded ? "preview pic" : "preview pic pending"}>
    {/* eslint-disable-next-line @next/next/no-img-element -- intrinsic size, straight from the CDN */}
    <img ref={img} src={source} alt={name} loading="eager" fetchPriority="high" onLoad={onLoad} onError={onError} />
  </div>;
}
