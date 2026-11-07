import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileShell } from "@/components/FileShell";
import { FilePreview } from "@/components/FilePreview";
import { CopyLink } from "@/components/CopyLink";
import { directUrl, fileUrl, formatFileSize, previewKind, previewUrl } from "@/lib/files";

type Props = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
};

const TEXT_LIMIT = 256 * 1024;

// One probe per request, shared by the metadata and the page. A one-byte
// range read gives the type and the full size; HEAD on ufs.sh often omits
// the length.
const probe = cache(async (source: string) => {
  try {
    const res = await fetch(source, { headers: { Range: "bytes=0-0" }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
    await res.body?.cancel();
    const total = res.status === 206 ? res.headers.get("content-range")?.split("/")[1] : res.headers.get("content-length");
    return { status: res.status, ok: res.ok, type: res.headers.get("content-type") || "", bytes: Number(total) || 0 };
  } catch {
    return null;
  }
});

// The first 256 kb of a text file, decoded on the server.
async function readText(source: string) {
  try {
    const res = await fetch(source, { headers: { Range: `bytes=0-${TEXT_LIMIT - 1}` }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer()).subarray(0, TEXT_LIMIT);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

async function load({ params, searchParams }: Props) {
  const { key } = await params;
  const query = await searchParams;
  const source = fileUrl(key);
  if (!source) notFound();
  const name = typeof query.name === "string" && query.name ? query.name.slice(0, 255) : key;
  const res = await probe(source);
  if (res?.status === 404) notFound();
  if (!res?.ok) throw new Error("Could not load the file. Please try again.");
  return { key, name, source, bytes: res.bytes, kind: previewKind(name, res.type), size: res.bytes ? formatFileSize(res.bytes) : "" };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { key, name, source, kind, size } = await load(props);
  const description = [kind === "other" ? "file" : kind, size, "preview or download"].filter(Boolean).join(" · ");
  return {
    title: `${name} · upload.pcstyle.dev`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: name,
      description,
      url: previewUrl({ key, name }),
      siteName: "upload.pcstyle.dev",
      ...(kind === "image" && { images: [{ url: source, alt: name }] }),
    },
    twitter: { card: kind === "image" ? "summary_large_image" : "summary", title: name, description },
  };
}

export default async function FilePage(props: Props) {
  const { key, name, source, bytes, kind, size } = await load(props);
  const text = kind === "text" ? await readText(source) : null;
  const ext = /\.([a-z0-9]{1,8})$/i.exec(name)?.[1].toLowerCase();
  const label = kind === "other" ? ext || "file" : ext && ext !== kind ? `${kind} · ${ext}` : kind;

  return <FileShell>
    <header className="file-head">
      <div className="file-id">
        <h1 className="file-name">{name}</h1>
        <p className="file-meta">
          <span className="kind">{label}</span>{size && ` · ${size}`}
          {kind === "html" && " · sandboxed preview"}
        </p>
      </div>
      <div className="file-acts">
        <CopyLink url={previewUrl({ key, name })} />
        <a className="lnk" href={directUrl({ key, name })}>open original</a>
        <a className="btn big" href={directUrl({ key, name }, true)}>download ↓</a>
      </div>
    </header>
    <div className="stage">
      {kind === "text" && text !== null
        ? <pre className="preview text">{text}{bytes > TEXT_LIMIT && <span className="more">{"\n"}… first 256 kb shown. download for the rest.</span>}</pre>
        : <FilePreview kind={kind === "text" ? "other" : kind} name={name}
          source={kind === "html" ? `/api/files/${encodeURIComponent(key)}?${new URLSearchParams({ name })}` : source} />}
    </div>
  </FileShell>;
}
