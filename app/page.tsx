import { Desk } from "@/components/Desk";
import { UploadZone } from "@/components/UploadZone";

export default function Home() {
  return (
    <Desk title="upload" meta="~/pcstyle/upload">
      <p className="lede" data-dither-text>drop it. get a link.</p>
      <dl className="facts">
        <dt>takes</dt><dd>images, videos, pdfs and html · up to 1gb per file</dd>
        <dt>goes</dt><dd>straight to Backblaze B2 · expires after 7, 30 or 90 days by size</dd>
        <dt>gives</dt><dd>one preview link per batch, shortened by <a href="https://s.pcstyle.dev">s.pcstyle.dev</a></dd>
      </dl>

      <h2 className="sect">drop zone</h2>
      <UploadZone />

      <h2 className="sect">how it works</h2>
      <ol className="steps">
        <li><span className="n">01</span><span><strong>drop, paste or browse.</strong> files queue up locally first; nothing leaves your machine yet.</span></li>
        <li><span className="n">02</span><span><strong>upload.</strong> one click sends the queue to Backblaze B2. up to 10 MiB stays 90 days; up to 100 MiB stays 30 days; larger files stay 7 days.</span></li>
        <li><span className="n">03</span><span><strong>share.</strong> multiple files land on one collection page with individual previews and downloads. a single file opens its preview directly. short links stay private: they don&apos;t show up in the shortener&apos;s public recent list.</span></li>
      </ol>
      <p className="foot"><span>© 2026 Adam Krupa</span> <a href="https://pcstyle.dev">pcstyle.dev</a> <a href="https://github.com/pcstyle-os/upload">github</a></p>
    </Desk>
  );
}
