"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import { BarChart3, Camera, Home, List, Settings } from "lucide-react";
import { savePendingReceiptCapture } from "@/lib/capture/pendingReceiptCapture";

const items = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/records", label: "一覧", icon: List },
  { href: "/reports", label: "集計", icon: BarChart3 },
  { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [capturing, setCapturing] = useState(false);

  async function handleCapture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCapturing(true);
    try {
      await savePendingReceiptCapture(file);
      router.push(`/records/new?entry=camera&captured=${Date.now()}`);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <nav className="bottom-nav" aria-label="下部ナビ">
      {items.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const active = item.href === "/records" ? pathname === "/records" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
            <span className="nav-icon-wrap">
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        className={`nav-link primary-nav-link ${pathname === "/records/new" ? "active" : ""}`}
        onClick={() => inputRef.current?.click()}
        disabled={capturing}
        aria-label="撮る"
      >
        <span className="nav-icon-wrap">
          <Camera size={22} strokeWidth={2.2} />
        </span>
        <span>{capturing ? "開いています" : "撮る"}</span>
      </button>
      <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={handleCapture} />

      {items.slice(2).map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
            <span className="nav-icon-wrap">
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
