import { FileShell } from "@/components/FileShell";

export default function Loading() {
  return <FileShell>
    <div className="stage">
      <div className="preview empty" role="status">
        <p>loading file…</p>
      </div>
    </div>
  </FileShell>;
}
