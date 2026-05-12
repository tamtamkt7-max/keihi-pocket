"use client";

import { ReactNode } from "react";
import { Button } from "./Button";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.42)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div className="card" style={{ width: "min(100%, 560px)", padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div className="heading">
          <h3>{title}</h3>
          <Button variant="ghost" onClick={onClose}>閉じる</Button>
        </div>
        {children}
      </div>
    </div>
  );
}
