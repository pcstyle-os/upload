"use client";

export default function PreviewError({ reset }: { reset: () => void }) {
  return <main className="max-w-2xl mx-auto px-6 py-16 space-y-6">
    <h1 className="text-lg">couldn’t load this file</h1>
    <p className="text-sm text-muted">the file service may be unavailable. try again in a moment.</p>
    <button onClick={reset} className="text-sm text-accent underline underline-offset-4">try again</button>
  </main>;
}
