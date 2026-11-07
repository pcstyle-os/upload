import { FileShell } from "@/components/FileShell";
import { Pix } from "@/components/Pix";

const title = "file not found";
const description = "this link points to a file that was deleted or never existed.";
export const metadata = {
  title: `${title} · upload.pcstyle.dev`, description,
  robots: { index: false, follow: false },
  openGraph: { title, description, siteName: "upload.pcstyle.dev" },
  twitter: { card: "summary", title, description },
};

export default function FileNotFound() {
  return <FileShell>
    <div className="stage">
      <div className="preview empty">
        <Pix name="file" className="tile" />
        <h1>this file isn’t here.</h1>
        <p className="hint">it was deleted, or the link is incomplete. ask the sender for a new one.</p>
      </div>
    </div>
  </FileShell>;
}
