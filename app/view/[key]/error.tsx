"use client";

import { startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileShell } from "@/components/FileShell";

export default function PreviewError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const { key } = useParams<{ key: string }>();
  // reset alone re-renders the cached error; refresh refetches the page.
  const retry = () => startTransition(() => { router.refresh(); reset(); });

  return <FileShell>
    <title>couldn’t load this file · upload.pcstyle.dev</title>
    <div className="stage">
      <div className="preview empty">
        <h1>couldn’t reach the file service.</h1>
        <p className="hint">it’s usually back in a moment.</p>
        <div className="row">
          <button type="button" className="btn big" onClick={retry}>try again</button>
          <a className="lnk" href={`/f/${encodeURIComponent(key)}`}>open original</a>
        </div>
      </div>
    </div>
  </FileShell>;
}
