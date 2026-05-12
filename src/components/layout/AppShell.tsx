"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="app-shell">
      <div className="sidebar-spacer" />
      <main className="main-panel">
        {children}
      </main>
      {hideNav ? null : <BottomNav />}
    </div>
  );
}
