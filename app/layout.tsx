import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Departure Mono (SIL OFL), the pixel mono of the pcstyle.dev desktop
const departure = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  weight: "400",
});

export const metadata: Metadata = {
  title: "~/upload · pcstyle",
  description: "file uploads for pcstyle.dev — drop it, get a link.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "~/upload · pcstyle",
    description: "file uploads for pcstyle.dev — drop it, get a link.",
    url: "https://upload.pcstyle.dev",
    siteName: "upload.pcstyle.dev",
    images: [
      {
        url: "https://og.pcstyle.dev/api/og?title=upload&subtitle=drop%20it%2C%20get%20a%20link&icon=upload&theme=magenta",
        width: 1200,
        height: 630,
        alt: "upload.pcstyle.dev",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "~/upload · pcstyle",
    description: "file uploads for pcstyle.dev — drop it, get a link.",
    images: [
      "https://og.pcstyle.dev/api/og?title=upload&subtitle=drop%20it%2C%20get%20a%20link&icon=upload&theme=magenta",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={departure.variable}>
        {children}
      </body>
    </html>
  );
}
