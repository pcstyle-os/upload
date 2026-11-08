import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/CopyLink";
import { FileShell } from "@/components/FileShell";
import { Pix } from "@/components/Pix";
import { collectionUrl, formatFileSize, previewKind } from "@/lib/files";
import { fileSource, readCollection } from "@/lib/storage";

type Props = { params: Promise<{ key: string }> };
const load = cache(readCollection);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await load((await params).key);
  const title = collection ? `${collection.files.length} shared files` : "collection not found";
  return { title: `${title} · upload.pcstyle.dev`, description: "preview and download shared files",
    robots: { index: false, follow: false }, openGraph: { title, siteName: "upload.pcstyle.dev" } };
}

export default async function CollectionPage({ params }: Props) {
  const { key } = await params;
  const collection = await load(key);
  if (!collection) notFound();
  const total = collection.files.reduce((size, file) => size + file.size, 0);
  return <FileShell>
    <header className="file-head">
      <div className="file-id">
        <h1 className="file-name">{collection.files.length} shared files</h1>
        <p className="file-meta">{formatFileSize(total)} · one collection · files expire individually</p>
      </div>
      <div className="file-acts"><CopyLink url={collectionUrl(key)} /></div>
    </header>
    <ul className="grid grid-cols-1 gap-4 overflow-y-auto py-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="shared files">
      {await Promise.all(collection.files.map(async file => {
        const expired = Date.parse(file.expiresAt) <= collection.loadedAt;
        const kind = previewKind(file.name, file.type);
        const source = !expired && kind === "image" && file.size <= 10 * 1024 ** 2 ? await fileSource(file.key) : null;
        return <li key={file.key} className="flex min-w-0 flex-col border border-[var(--line)] bg-[var(--bg)] p-3">
          {!expired && <Link href={`/view/${encodeURIComponent(file.key)}`} className="mb-3 grid h-40 place-items-center border-b border-[var(--line)]" aria-label={`preview ${file.name}`}>
            {source ? <Image src={source} alt={file.name} width={320} height={160} unoptimized className="h-40 w-full object-contain" />
              : <span className="flex flex-col items-center gap-3 text-[var(--dim)]"><Pix name="file" className="h-8 w-8" />{kind}</span>}
          </Link>}
          <h2 className="break-all">{file.name}</h2>
          <p className="my-1 text-[var(--dim)]">{formatFileSize(file.size)} · {expired ? "expired" : `expires ${file.expiresAt.slice(0, 10)}`}</p>
          {!expired && <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <Link className="lnk" href={`/view/${encodeURIComponent(file.key)}`}>preview</Link>
            <a className="btn inline-flex items-center gap-2" href={`/f/${encodeURIComponent(file.key)}?download=1`}><Pix name="download" className="h-2 w-2" />download</a>
          </div>}
        </li>;
      }))}
    </ul>
  </FileShell>;
}
