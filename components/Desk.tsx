import Link from "next/link";
import { Aurora } from "./Aurora";
import { Clock } from "./Clock";
import { Pix } from "./Pix";

// The pcstyle.dev desktop shell: aurora wallpaper, top bar, one window with a
// dithered title bar, and a taskbar. Closing the window goes home.
export function Desk({ title, meta, children, wide = false }: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <Aurora />
      <header className="topbar">
        <Link className="brand" href="/">~/pcstyle<span>/upload</span></Link>
        <nav>
          <a href="https://pcstyle.dev">home</a>
          <a href="https://s.pcstyle.dev">s</a>
          <a href="https://github.com/pcstyle-os/upload">github</a>
        </nav>
      </header>
      <main className={wide ? "desk wide" : "desk"}>
        <section className="win" aria-labelledby="win-title">
          <header className="bar">
            <span className="k">1</span>
            <h1 className="t" id="win-title" title={title}>{title}</h1>
            {meta && <span className="meta">{meta}</span>}
            <a className="x" href="https://pcstyle.dev" aria-label="close, back to pcstyle.dev"><Pix name="x" /></a>
          </header>
          <div className="body">{children}</div>
        </section>
      </main>
      <footer className="taskbar">
        <span className="task" title={title}><span className="k">1</span>{title}</span>
        <span className="tray">
          <a href="https://pcstyle.dev">pcstyle.dev</a>
          <Clock />
        </span>
      </footer>
    </>
  );
}
