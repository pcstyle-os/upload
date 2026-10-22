"use client";

import { useState } from "react";
import Image from "next/image";

export function FilePreview({ kind, source, name }: {
  kind: "html" | "image" | "other";
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

  return <div className="preview">
    <Image src={source} alt={name} fill unoptimized sizes="100vw"
      style={{ objectFit: "contain" }} onError={() => setFailed(true)} />
  </div>;
}
