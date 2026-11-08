import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileShell } from "@/components/FileShell";
import { FilePreview } from "@/components/FilePreview";
import { CopyLink } from "@/components/CopyLink";
import { Pix } from "@/components/Pix";
import { directUrl, dispositionName, formatFileSize, previewKind, previewUrl } from "@/lib/files";
import { fileSource } from "@/lib/storage";
import { b2File } from "@/lib/retention";
import { listZip } from "@/lib/zip";

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
    let res = await fetch(source, { headers: { Range: "bytes=0-0" }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8_000) });
    // An empty B2 object has no byte 0; read its headers without a Range instead.
    if (res.status === 416) {
      await res.body?.cancel();
      res = await fetch(source, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8_000) });
    }
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

// Bytes start..end (inclusive) of the file. Throws when the CDN won't serve
// the range, so callers never pull a whole large file by accident.
async function readRange(source: string, start: number, end: number) {
  const res = await fetch(source, { headers: { Range: `bytes=${start}-${end}` }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (res.status !== 206) {
    await res.body?.cancel();
    throw new Error(`range ${start}-${end} returned ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer()).subarray(0, end - start + 1);
}

// The first 64 kb of a text file, decoded on the server.
async function readText(source: string) {
  try {
    return new TextDecoder().decode(await readRange(source, 0, TEXT_LIMIT - 1), { stream: true });
  } catch {
    return null;
  }
}

async function load({ params }: Props) {
  const { key } = await params;
  const source = await fileSource(key);
  if (!source) notFound();
  const res = await probe(source);
  if (res?.status === 404) notFound();
  if (!res?.ok) throw new Error("Could not load the file. Please try again.");
  // Only the name the file was uploaded with counts; a link can't relabel it.
  const name = (res.name || key).slice(0, 255);
  const kind = previewKind(name, res.type);
  const ext = /\.([a-z0-9]{1,8})$/i.exec(name)?.[1].toLowerCase();
  const label = kind === "other" || kind === "text" || kind === "archive" ? ext || kind : ext && ext !== kind ? `${kind} · ${ext}` : kind;
  return { key, name, source, bytes: res.bytes, kind, label, size: res.bytes ? formatFileSize(res.bytes) : "" };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  // Dead links get their own title and no uploader pitch in the unfurl.
  const cdn = await fileSource((await props.params).key);
  const res = cdn ? await probe(cdn) : null;
  if (!res?.ok) {
    const title = !cdn || res?.status === 404 ? "file not found" : "couldn’t load this file";
    return { title: `${title} · upload.pcstyle.dev`, robots: { index: false, follow: false }, openGraph: { title, siteName: "upload.pcstyle.dev" }, twitter: { card: "summary", title } };
  }
  const { key, name, source, kind, label, size } = await load(props);
  const description = [label, size, "preview or download"].filter(Boolean).join(" · ");
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
  const { key, name, source, bytes, kind, label, size } = await load(props);
  const htmlPath = `/api/files/${encodeURIComponent(key)}?${new URLSearchParams({ name })}`;

  return <FileShell>
    <header className="file-head">
      <div className="file-id">
        <h1 className="file-name" title={name}>{name}</h1>
        <p className="file-meta">
          <span className="kind">{label}</span>{size && ` · ${size}`}
          {kind === "html" && " · sandboxed preview"}
          {b2File(key) && ` · expires ${new Date(b2File(key)!.expiresAt).toISOString().slice(0, 10)}`}
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
        : kind === "archive"
        ? <Suspense fallback={<p className="preview text" role="status">reading archive…</p>}>
          <ZipPreview source={source} name={name} bytes={bytes} />
        </Suspense>
        : <FilePreview kind={kind} name={name} source={kind === "html" ? htmlPath : source} />}
    </div>
  </FileShell>;
}

async function TextPreview({ source, name, bytes }: { source: string; name: string; bytes: number }) {
  const text = bytes === 0 ? "" : await readText(source);
  if (text === null) return <FilePreview kind="other" failed name={name} source={source} />;
  return <pre className="preview text" tabIndex={0} aria-label={`contents of ${name}`}>
    {text}{bytes > TEXT_LIMIT && <span className="more">{"\n"}… first 64 kb shown. download for the rest.</span>}
  </pre>;
}

async function ZipPreview({ source, name, bytes }: { source: string; name: string; bytes: number }) {
  const zip = bytes ? await listZip(bytes, (start, end) => readRange(source, start, end)).catch(() => null) : null;
  if (!zip) return <FilePreview kind="other" name={name} source={source} />;
  const files = zip.entries.filter(entry => !entry.dir).length;
  return <div className="preview zip" tabIndex={0} aria-label={`contents of ${name}`}>
    <p className="zip-sum">
      {files} {files === 1 ? "file" : "files"} · {formatFileSize(zip.unpacked)} unpacked
      {zip.truncated && ` · first ${zip.entries.length} entries shown`}
    </p>
    <ul className="zip-list">
      {withParents(zip.entries).map(entry => {
        const parts = entry.name.replace(/\/$/, "").split("/");
        return <li key={entry.name} className={entry.dir ? "dir" : undefined}>
          <span className="n" style={{ paddingLeft: `${(parts.length - 1) * 2}ch` }} title={entry.name}>
            {parts.at(-1)}{entry.dir && "/"}
          </span>
          {!entry.dir && <span className="s">{formatFileSize(entry.size)}</span>}
        </li>;
      })}
    </ul>
  </div>;
}

// Zips may omit folder records; add a row for every folder a file sits in,
// so a nested file never loses its path.
function withParents(entries: { name: string; size: number; dir: boolean }[]) {
  const seen = new Set(entries.filter(entry => entry.dir).map(entry => entry.name));
  return entries.flatMap(entry => {
    const parts = entry.name.replace(/\/$/, "").split("/");
    const missing = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/") + "/").filter(dir => !seen.has(dir));
    missing.forEach(dir => seen.add(dir));
    return [...missing.map(name => ({ name, size: 0, dir: true })), entry];
  });
}
