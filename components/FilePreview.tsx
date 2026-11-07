"use client";

import { useState } from "react";
import Image from "next/image";
import type { PreviewKind } from "@/lib/files";
import { Pix } from "./Pix";

export function FilePreview({ kind, source, name }: {
  kind: PreviewKind;
  source: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || kind === "other") {
    return <div className="preview empty">
      <Pix name="file" className="tile" />
      <p>{failed ? "the preview didn’t load." : "no preview for this file type."}</p>
      <p className="hint">use download to save it.</p>
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

  if (kind === "video") {
    return <video className="preview" src={source} controls preload="metadata" aria-label={name}
      onError={() => setFailed(true)} />;
  }

  if (kind === "audio") {
    return <div className="preview audio"><audio className="w-full" src={source} controls preload="metadata"
      aria-label={name} onError={() => setFailed(true)} /></div>;
  }

  return <div className="preview">
    <Image src={source} alt={name} fill unoptimized sizes="100vw"
      style={{ objectFit: "contain" }} onError={() => setFailed(true)} />
  </div>;
}
