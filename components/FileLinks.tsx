"use client";

import { useState } from "react";

export function FileLinks({ preview, direct, download }: {
  preview: string;
  direct?: string;
  download?: string;
}) {
  const [mode, setMode] = useState("preview");
  const [status, setStatus] = useState("");
  const url = (mode === "direct" ? direct : mode === "download" ? download : preview) || preview;

  return <div className="my-2 min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      {direct || download ? <label className="flex items-center gap-2">
        link
        <select className="field" value={mode} onChange={event => { setMode(event.target.value); setStatus(""); }}>
          <option value="preview">preview</option>
          {direct && <option value="direct">direct · redirect to file</option>}
          {download && <option value="download">download · save file</option>}
        </select>
      </label> : <span>collection preview</span>}
      <button type="button" className="btn" onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setStatus("copied");
        } catch {
          setStatus("couldn’t copy. select the link below.");
        }
      }}>copy link</button>
      <span role="status">{status}</span>
    </div>
    <input className="field mt-1" aria-label={`${mode} link`} readOnly value={url}
      onFocus={event => event.target.select()} />
  </div>;
}
