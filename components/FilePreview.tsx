"use client";

import { useState } from "react";
import Image from "next/image";
import { previewKind } from "@/lib/files";

export function FilePreview({ kind, source, name }: {
  kind: ReturnType<typeof previewKind>;
  source: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || kind === "other") {
    return <p className="preview empty">
      {failed ? "couldn’t load the preview. try downloading the file." : "no preview for this file type. use download to save it."}
    </p>;
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
      <p className="preview empty">this browser cannot display the pdf. use download to save it.</p>
    </object>;
  }

  if (kind === "video") {
    return <video className="preview" src={source} controls preload="metadata" aria-label={name}
      onError={() => setFailed(true)} />;
  }

  if (kind === "audio") {
    return <div className="preview empty"><audio className="w-full" src={source} controls preload="metadata"
      aria-label={name} onError={() => setFailed(true)} /></div>;
  }

  return <div className="preview">
    <Image src={source} alt={name} fill unoptimized sizes="100vw"
      style={{ objectFit: "contain" }} onError={() => setFailed(true)} />
  </div>;
}
