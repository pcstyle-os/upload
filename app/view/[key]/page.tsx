import { notFound } from "next/navigation";
import { Desk } from "@/components/Desk";
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

  return <Desk wide title={name} meta={<a href={`${filePath}&download=1`}>download ↓</a>}>
    {kind === "html" && <p className="hint">html preview · isolated from the uploader</p>}
    <FilePreview kind={kind} name={name} source={kind === "html" ? filePath : source} />
  </Desk>;
}
