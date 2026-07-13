import { UploadZone } from "@/components/UploadZone";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <span className="text-sm text-faint">
        <span className="text-accent-dim">##</span> {children}
      </span>
      <div className="flex-1 h-px bg-hairline" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* nav */}
      <header className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between text-sm">
        <a href="https://pcstyle.dev" className="text-foreground">
          <span className="text-faint">~/</span>
          <span className="font-semibold">pcstyle</span>
          <span className="text-faint">/upload</span>
        </a>
        <nav className="flex items-center gap-6 text-muted">
          <a href="https://pcstyle.dev" className="hover:text-foreground transition-colors">
            home
          </a>
          <a
            href="https://github.com/pcstyle-os/upload"
            className="hover:text-foreground transition-colors"
          >
            github
          </a>
        </nav>
      </header>

      {/* hero */}
      <section className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <p className="text-sm text-accent mb-4">
          <span className="text-accent-dim">→</span> upload
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
          Drop it. Get a link.
        </h1>
        <p className="text-muted leading-relaxed max-w-md">
          file uploads for <span className="text-foreground">pcstyle.dev</span>:
          images, videos and PDFs, straight to the CDN. no accounts, no fuss —
          a permanent URL in seconds.
        </p>
        <div className="flex flex-wrap gap-2 mt-8">
          {["images", "videos", "pdf", "up to 256mb"].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 text-xs text-accent border border-accent-dim/60 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* upload */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <SectionLabel>drop zone</SectionLabel>
        <UploadZone />
      </section>

      {/* how it works */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <SectionLabel>how it works</SectionLabel>
        <ol className="space-y-0">
          {[
            {
              n: "01",
              title: "drop or browse",
              body: "drag files into the zone or pick them from disk. they queue up locally first — nothing leaves your machine yet.",
            },
            {
              n: "02",
              title: "upload",
              body: "one click sends the queue to UploadThing. files land on a global CDN with enterprise-grade storage behind them.",
            },
            {
              n: "03",
              title: "share",
              body: "every file gets a permanent URL. copy it, open it, or clear it from the list — the link keeps working either way.",
            },
          ].map((step) => (
            <li
              key={step.n}
              className="grid grid-cols-[3rem_1fr] gap-2 py-6 border-t border-hairline first:border-t-0"
            >
              <span className="text-sm text-accent-dim">{step.n}</span>
              <div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* footer */}
      <footer className="max-w-2xl mx-auto px-6 py-10 border-t border-hairline flex items-center justify-between text-xs text-faint">
        <span>© 2026 Adam Krupa</span>
        <div className="flex gap-4">
          <a href="https://pcstyle.dev" className="hover:text-foreground transition-colors">
            pcstyle.dev
          </a>
          <span>·</span>
          <a
            href="https://github.com/pcstyle-os/upload"
            className="hover:text-foreground transition-colors"
          >
            github
          </a>
        </div>
      </footer>
    </main>
  );
}
