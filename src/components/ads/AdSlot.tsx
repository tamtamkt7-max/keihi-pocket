"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adSlots, adsenseClient, adsenseEnabled } from "@/lib/runtime/appMode";

type Placement = "home-bottom" | "reports-bottom" | "settings";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ placement }: { placement: Placement }) {
  const initialized = useRef(false);
  const slotRef = useRef<HTMLElement | null>(null);
  const slot = useMemo(() => adSlots[placement], [placement]);
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    const element = slotRef.current;

    if (!element) {
      return;
    }

    const updateVisibility = () => {
      const status = element.getAttribute("data-ad-status");
      setIsVisible(status === "filled");
    };

    updateVisibility();

    const observer = new MutationObserver(updateVisibility);
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    const timer = window.setTimeout(updateVisibility, 4000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [slot]);

  if (!adsenseEnabled || !adsenseClient || !slot) {
    return null;
  }

  return (
    <div className={isVisible ? "card list-card ad-card ad-card-visible" : "ad-card ad-card-hidden"} aria-hidden={!isVisible}>
      <ins
        ref={(node) => {
          slotRef.current = node;
        }}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
