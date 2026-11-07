import { FileShell } from "@/components/FileShell";

export default function FileNotFound() {
  return <FileShell>
    <div className="stage">
      <div className="preview empty">
        <p>this file isn’t here.</p>
        <p className="hint">it was deleted, or the link is incomplete. ask the sender for a new one.</p>
      </div>
    </div>
  </FileShell>;
}
