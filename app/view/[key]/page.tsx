import { notFound } from "next/navigation";
import Link from "next/link";
import { FilePreview } from "@/components/FilePreview";
import { fileUrl, previewKind } from "@/lib/files";

export const metadata = { title: "file preview · pcstyle", robots: { index: false, follow: false } };

export default async function FilePage({ params, searchParams }: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
}) {
  const { key } = await params;
  const query = await searchParams;
  const source = fileUrl(key);
  if (!source) notFound();
  const name = typeof query.name === "string" ? query.name.slice(0, 255) : key;

  let file: Response;
  try {
    file = await fetch(source, { method: "HEAD", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error("Could not load the file. Please try again.");
  }
  if (file.status === 404) notFound();
  if (!file.ok) throw new Error("Could not load the file. Please try again.");

  const kind = previewKind(name, file.headers.get("content-type") || "");
  const filePath = `/api/files/${encodeURIComponent(key)}?${new URLSearchParams({ name })}`;

  return <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <Link href="/" className="text-muted hover:text-foreground">~/pcstyle/upload</Link>
      <a href={`${filePath}&download=1`} className="text-accent underline underline-offset-4 hover:text-foreground">download ↓</a>
    </header>
    <div className="space-y-2">
      <h1 className="text-lg break-words">{name}</h1>
      {kind === "html" && <p className="text-xs text-muted">html preview · isolated from the uploader</p>}
    </div>
    <FilePreview kind={kind} name={name} source={kind === "html" ? filePath : source} />
  </main>;
}
