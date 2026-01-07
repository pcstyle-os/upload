import { CyberUploadZone } from "@/components/CyberUploadZone";
import { Upload, Zap, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-[#ff00ff]/20 bg-black/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-[#ff00ff] flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_#ff00ff66] transition-all group-hover:shadow-[0_0_25px_#ff00ff]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase group-hover:text-[#ff00ff] transition-colors">
                uploader<span className="text-[#ff00ff]/40">.pcstyle</span>
              </h1>
              <p className="text-xs text-gray-600 uppercase tracking-[0.3em] font-mono">
                FILE_TRANSFER_PROTOCOL
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-gray-500 font-mono uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              SYSTEM_ONLINE
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block">
            <span className="px-4 py-1 bg-[#ff00ff]/10 border border-[#ff00ff]/30 text-[#ff00ff] text-xs font-mono uppercase tracking-[0.3em] rounded-full">
              SECURE • FAST • RELIABLE
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
            <span className="text-white">CYBERNETIC</span>
            <br />
            <span className="text-[#ff00ff]">FILE UPLOAD</span>
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
            High-performance file transfer protocol powered by UploadThing.
            Upload images, videos, and documents with enterprise-grade security
            and lightning-fast CDN delivery.
          </p>
        </div>
      </section>

      {/* Upload Zone */}
      <section className="px-6 pb-20">
        <CyberUploadZone />
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[#ff00ff]/10">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-xs text-gray-600 uppercase tracking-[0.5em] mb-12 font-mono">
            PROTOCOL_CAPABILITIES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "BLAZING FAST",
                description:
                  "Global CDN distribution ensures your files are delivered at maximum velocity.",
              },
              {
                icon: Shield,
                title: "SECURE TRANSFER",
                description:
                  "End-to-end encryption with enterprise-grade security protocols.",
              },
              {
                icon: Clock,
                title: "INSTANT ACCESS",
                description:
                  "Files are immediately available via permanent, shareable URLs.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 bg-black/50 border border-[#ff00ff]/20 rounded-lg backdrop-blur-sm hover:border-[#ff00ff]/50 transition-all group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 bg-[#ff00ff]/10 rounded-lg w-fit mb-4 group-hover:bg-[#ff00ff]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#ff00ff]" />
                </div>
                <h4 className="text-white font-bold uppercase tracking-wider mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-500 text-sm font-mono leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#ff00ff]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] text-[#ff00ff] font-black uppercase tracking-[0.5em] opacity-30">
              © 2025 pcstyle.dev
            </p>
            <span className="text-[10px] text-gray-800 uppercase tracking-widest font-mono">
              PROTOCOL_RESERVED: UPLOAD-777-ALPHA
            </span>
          </div>
          <div className="flex gap-10 text-gray-700">
            {["PRIVACY", "NETWORK", "SOURCE"].map((link) => (
              <span
                key={link}
                className="text-[10px] uppercase font-black hover:text-[#ff00ff] transition-all tracking-[0.3em]"
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
