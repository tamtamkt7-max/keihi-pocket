"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
import { signOutUser } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";

function getInitial(user: { displayName?: string | null; email?: string | null }) {
  const source = user.displayName || user.email || "?";
  return source.trim().charAt(0).toUpperCase();
}

export function AccountMenu() {
  const pathname = usePathname();
  const { user, isDemoMode, isCloudMode, isSignedIn } = useAuth();

  if (isDemoMode || !user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname || "/dashboard")}`} className="account-login-link">
        <UserCircle2 size={18} />
        <span>ログイン</span>
      </Link>
    );
  }

  return (
    <details className="account-menu">
      <summary className="account-trigger" aria-label="アカウント">
        {isSignedIn && "photoURL" in user && user.photoURL ? (
          <img src={user.photoURL} alt="" className="account-avatar" />
        ) : (
          <span className="account-avatar account-avatar-fallback">{getInitial(user)}</span>
        )}
      </summary>
      <div className="account-popover">
        <div className="account-popover-header">
          {isSignedIn && "photoURL" in user && user.photoURL ? (
            <img src={user.photoURL} alt="" className="account-avatar account-avatar-large" />
          ) : (
            <span className="account-avatar account-avatar-fallback account-avatar-large">{getInitial(user)}</span>
          )}
          <div>
            <strong>{isCloudMode ? "ログイン中" : "アカウント"}</strong>
            <div className="subtitle">{user.email || user.displayName || "アカウント情報"}</div>
          </div>
        </div>
        <Link href="/settings" className="account-popover-link">
          <Settings size={16} />
          <span>設定へ</span>
        </Link>
        <button type="button" className="account-popover-link account-popover-button" onClick={() => signOutUser()}>
          <LogOut size={16} />
          <span>ログアウト</span>
        </button>
      </div>
    </details>
  );
}
