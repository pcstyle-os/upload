import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NeuralCursor } from "@/components/ui/NeuralCursor";
import { CRTOverlay } from "@/components/ui/CRTOverlay";
import { MatrixBackground } from "@/components/ui/MatrixBackground";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["100", "400", "700", "800"],
});

export const metadata: Metadata = {
  title: "UPLOADER // SYSTEM_READY",
  description: "Cybernetic File Upload Protocol - pcstyle",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "UPLOADER // SYSTEM_READY",
    description: "Cybernetic File Upload Protocol - pcstyle",
    url: "https://upload.pcstyle.dev",
    siteName: "UPLOADER",
    images: [
      {
        url: "https://og.pcstyle.dev/api/og?title=UPLOADER&subtitle=Cybernetic%20File%20Upload&icon=upload&theme=cyan",
        width: 1200,
        height: 630,
        alt: "Uploader Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPLOADER // SYSTEM_READY",
    description: "Cybernetic File Upload Protocol - pcstyle",
    images: ["https://og.pcstyle.dev/api/og?title=UPLOADER&subtitle=Cybernetic%20File%20Upload&icon=upload&theme=cyan"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} antialiased bg-black`}>
        <MatrixBackground />
        <CRTOverlay />
        <div className="relative z-10">{children}</div>
        <NeuralCursor />
      </body>
    </html>
  );
}
