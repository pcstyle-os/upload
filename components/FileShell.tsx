import Link from "next/link";
import { Mat } from "./Mat";

// The bare shell for shared file links: the file, its name, and a quiet
// credit line. No desktop chrome.
export function FileShell({ children }: { children: React.ReactNode }) {
  return <>
    <Mat />
    <main className="file">{children}</main>
    <footer className="file-foot">
      shared with <Link href="/">upload.pcstyle.dev</Link>
    </footer>
  </>;
}
