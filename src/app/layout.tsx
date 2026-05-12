import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AdSenseScript } from "@/components/ads/AdSenseScript";

export const metadata: Metadata = {
  title: {
    default: "経費ポケット",
    template: "%s | 経費ポケット",
  },
  description: "レシートを撮って、経費と売上をまとめて管理。",
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
};

export const viewport: Viewport = {
  themeColor: "#117865",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <AdSenseScript />
        {children}
      </body>
    </html>
  );
}
