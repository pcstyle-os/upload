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
    return <p className="py-20 text-center text-sm text-muted">
      {failed ? "couldn’t load the preview. try downloading the file." : "no preview for this file type. use download to save it."}
    </p>;
  }

  if (kind === "html") {
    return <iframe
      title={`preview of ${name}`}
      src={source}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className="w-full h-[75vh] min-h-96 rounded-lg border border-hairline bg-white"
    />;
  }

  return <div className="relative h-[75vh] min-h-96 rounded-lg border border-hairline">
    <Image src={source} alt={name} fill unoptimized sizes="100vw"
      className="object-contain" onError={() => setFailed(true)} />
  </div>;
}
