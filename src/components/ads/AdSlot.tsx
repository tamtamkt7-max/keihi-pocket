"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { adSlots, adsenseClient, adsenseEnabled } from "@/lib/runtime/appMode";

type Placement = "home-bottom" | "reports-bottom" | "settings";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ placement }: { placement: Placement }) {
  const initialized = useRef(false);
  const slot = useMemo(() => adSlots[placement], [placement]);

  useEffect(() => {
    if (!adsenseEnabled || !adsenseClient || !slot || initialized.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      initialized.current = true;
    } catch (error) {
      console.error("adsense slot init failed", { placement, error });
    }
  }, [placement, slot]);

  if (!adsenseEnabled || !adsenseClient || !slot) {
    return null;
  }

  return (
    <Card className="list-card ad-card">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </Card>
  );
}
