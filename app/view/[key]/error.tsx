"use client";

import { FileShell } from "@/components/FileShell";

export default function PreviewError({ reset }: { reset: () => void }) {
  return <FileShell>
    <div className="stage">
      <div className="preview empty">
        <p>couldn’t reach the file service.</p>
        <p className="hint">it’s usually back in a moment.</p>
        <button type="button" className="btn big" onClick={reset}>try again</button>
      </div>
    </div>
  </FileShell>;
}
