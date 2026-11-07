import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileShell } from "@/components/FileShell";
import { FilePreview } from "@/components/FilePreview";
import { CopyLink } from "@/components/CopyLink";
import { Pix } from "@/components/Pix";
import { directUrl, dispositionName, fileUrl, formatFileSize, previewKind, previewUrl } from "@/lib/files";

type Props = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
};

const TEXT_LIMIT = 64 * 1024;

// A one-byte range read gives the type, the full size and the uploaded
// name; HEAD on ufs.sh often omits the length. Retries once, so a single
// CDN blip doesn't show the error page.
async function probeOnce(source: string) {
  try {
    const res = await fetch(source, { headers: { Range: "bytes=0-0" }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8_000) });
    await res.body?.cancel();
    const total = res.status === 206 ? res.headers.get("content-range")?.split("/")[1] : res.headers.get("content-length");
    return {
      status: res.status, ok: res.ok,
      type: res.headers.get("content-type") || "",
      name: dispositionName(res.headers.get("content-disposition")),
      bytes: Number(total) || 0,
    };
  } catch {
    return null;
  }
}

// One probe per request, shared by the metadata and the page.
const probe = cache(async (source: string) => {
  const first = await probeOnce(source);
  return first && (first.ok || first.status === 404) ? first : probeOnce(source);
});

// The first 64 kb of a text file, decoded on the server.
async function readText(source: string) {
  try {
    const res = await fetch(source, { headers: { Range: `bytes=0-${TEXT_LIMIT - 1}` }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer()).subarray(0, TEXT_LIMIT);
    return new TextDecoder().decode(bytes, { stream: true });
  } catch {
    return null;
  }
}

async function load({ params, searchParams }: Props) {
  const { key } = await params;
  const query = await searchParams;
  const source = fileUrl(key);
  if (!source) notFound();
  const res = await probe(source);
  if (res?.status === 404) notFound();
  if (!res?.ok) throw new Error("Could not load the file. Please try again.");
  // The name the file was uploaded with wins over the one in the link.
  const name = (res.name || (typeof query.name === "string" && query.name) || key).slice(0, 255);
  return { key, name, source, bytes: res.bytes, kind: previewKind(name, res.type), size: res.bytes ? formatFileSize(res.bytes) : "" };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { key, name, source, kind, size } = await load(props);
  const description = [kind === "other" ? "file" : kind, size, "preview or download"].filter(Boolean).join(" · ");
  const card = `https://og.pcstyle.dev/api/og?${new URLSearchParams({ title: name, subtitle: description, icon: "upload", theme: "magenta" })}`;
  return {
    title: `${name} · upload.pcstyle.dev`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: name,
      description,
      url: previewUrl({ key, name }),
      siteName: "upload.pcstyle.dev",
      images: kind === "image" ? [{ url: source, alt: name }] : [{ url: card, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function FilePage(props: Props) {
  const { key, name, source, bytes, kind, size } = await load(props);
  const ext = /\.([a-z0-9]{1,8})$/i.exec(name)?.[1].toLowerCase();
  const label = kind === "other" || kind === "text" ? ext || kind : ext && ext !== kind ? `${kind} · ${ext}` : kind;
  const htmlPath = `/api/files/${encodeURIComponent(key)}?${new URLSearchParams({ name })}`;

  return <FileShell>
    <header className="file-head">
      <div className="file-id">
        <h1 className="file-name" title={name}>{name}</h1>
        <p className="file-meta">
          <span className="kind">{label}</span>{size && ` · ${size}`}
          {kind === "html" && " · sandboxed preview"}
        </p>
      </div>
      <div className="file-acts">
        <CopyLink url={previewUrl({ key, name })} />
        <a className="lnk" href={kind === "html" ? htmlPath : directUrl({ key, name })}>open original</a>
        <a className="btn big" href={directUrl({ key, name }, true)}><Pix name="download" />download</a>
      </div>
    </header>
    <div className="stage">
      {kind === "text"
        ? <Suspense fallback={<p className="preview text" role="status">loading text…</p>}>
          <TextPreview source={source} name={name} bytes={bytes} />
        </Suspense>
        : <FilePreview kind={kind} name={name} source={kind === "html" ? htmlPath : source} />}
    </div>
  </FileShell>;
}

async function TextPreview({ source, name, bytes }: { source: string; name: string; bytes: number }) {
  const text = await readText(source);
  if (text === null) return <FilePreview kind="other" failed name={name} source={source} />;
  return <pre className="preview text" tabIndex={0} aria-label={`contents of ${name}`}>
    {text}{bytes > TEXT_LIMIT && <span className="more">{"\n"}… first 64 kb shown. download for the rest.</span>}
  </pre>;
}
