import { FileShell } from "@/components/FileShell";

export default function FileNotFound() {
  return <FileShell>
    <title>file not found · upload.pcstyle.dev</title>
    <div className="stage">
      <div className="preview empty">
        <h1>this file isn’t here.</h1>
        <p className="hint">it was deleted, or the link is incomplete. ask the sender for a new one.</p>
      </div>
    </div>
  </FileShell>;
}
