import Script from "next/script";
import { adsenseClient, adsenseEnabled } from "@/lib/runtime/appMode";

export function AdSenseScript() {
  if (!adsenseEnabled || !adsenseClient) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
    />
  );
}
