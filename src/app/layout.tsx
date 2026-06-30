import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { Inter, Outfit } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "経費ポケット",
    template: "%s | 経費ポケット",
  },
  description: "レシートを撮って、経費と売上をまとめて管理。日々の支払いを簡単に記録・整理するためのツールです。",
  applicationName: "経費ポケット",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "経費ポケット",
    statusBarStyle: "default",
  },
  other: {
    "google-adsense-account": "ca-pub-5461809032953003",
  },
};

export const viewport: Viewport = {
  themeColor: "#117865",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AdSenseScript />
        {children}
      </body>
    </html>
  );
}