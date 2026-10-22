import { Desk } from "@/components/Desk";
import { UploadZone } from "@/components/UploadZone";

export default function Home() {
  return (
    <Desk title="upload" meta="~/pcstyle/upload">
      <p className="lede" data-dither-text>drop it. get a link.</p>
      <dl className="facts">
        <dt>takes</dt><dd>images, videos, pdfs and html · up to 1gb per file</dd>
        <dt>goes</dt><dd>straight to the UploadThing CDN</dd>
        <dt>gives</dt><dd>a preview page and a short link from <a href="https://s.pcstyle.dev">s.pcstyle.dev</a></dd>
      </dl>

      <h2 className="sect">drop zone</h2>
      <UploadZone />

      <h2 className="sect">how it works</h2>
      <ol className="steps">
        <li><span className="n">01</span><span><strong>drop or browse.</strong> files queue up locally first; nothing leaves your machine yet.</span></li>
        <li><span className="n">02</span><span><strong>upload.</strong> one click sends the queue to UploadThing&apos;s global CDN.</span></li>
        <li><span className="n">03</span><span><strong>share.</strong> every file gets a short link. images and html open in a preview, with a separate download. short links show up in the shortener&apos;s public recent list.</span></li>
      </ol>
      <p className="foot"><span>© 2026 Adam Krupa</span> <a href="https://pcstyle.dev">pcstyle.dev</a> <a href="https://github.com/pcstyle-os/upload">github</a></p>
    </Desk>
  );
}
