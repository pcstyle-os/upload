"use client";

import { Desk } from "@/components/Desk";

export default function PreviewError({ reset }: { reset: () => void }) {
  return <Desk title="couldn’t load this file">
    <p className="err">the file service may be unavailable. try again in a moment.</p>
    <p className="foot"><button type="button" className="lnk" onClick={reset}>try again</button></p>
  </Desk>;
}
