"use client";

import { ChangeEvent, ReactNode, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { savePendingReceiptCapture } from "@/lib/capture/pendingReceiptCapture";

type Props = {
  children?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function ReceiptCaptureButton({ children, className = "button primary", compact = false }: Props) {
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
      router.push("/records/new?entry=camera&captured=1");
    } finally {
      setCapturing(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()} disabled={capturing}>
        <Camera size={compact ? 18 : 20} />
        {capturing ? "開いています" : children || "撮る"}
      </button>
      <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={handleCapture} />
    </>
  );
}
