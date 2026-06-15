"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firestore/users";
import { UserProfile } from "@/types/user";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { checkRedirectResultOnce } from "@/lib/firebase/auth";
import { clearDemoSession, getDemoProfile, hasDemoSession, isDemoUserId } from "@/lib/mock/localDb";

type DemoUser = Pick<User, "uid" | "displayName" | "email" | "photoURL">;
type AuthMode = "cloud" | "demo" | "signed-out";

function setDemoState(
  setUser: (value: User | DemoUser | null) => void,
  setProfile: (value: UserProfile | null) => void,
  setMode: (value: AuthMode) => void
) {
  if (hasDemoSession()) {
    const demoProfile = getDemoProfile();
    setUser({
      uid: demoProfile.id,
      displayName: demoProfile.displayName,
      email: demoProfile.email || null,
      photoURL: null,
    });
    setProfile(demoProfile);
    setMode("demo");
    return true;
  }

  setUser(null);
  setProfile(null);
  setMode("signed-out");
  return false;
}

export function useAuth() {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>("signed-out");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;
    let unsubscribe: undefined | (() => void);

    console.log("firebase config available", { enabled: firebaseEnabled, hasAuth: Boolean(auth) });
    console.log("auth loading start");

    const endLoading = () => {
      if (!mounted) return;
      setLoading(false);
      console.log("auth loading end");
    };

    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      if (!auth || !firebaseEnabled) {
        setDemoState(setUser, setProfile, setMode);
      }
      if (!auth || !firebaseEnabled) {
        endLoading();
      }
    }, 2500);

    async function start() {
      if (!firebaseEnabled || !auth) {
        setDemoState(setUser, setProfile, setMode);
        endLoading();
        return;
      }

      try {
        await checkRedirectResultOnce();
      } catch (error) {
        console.error("redirect result check failed", error);
        if (mounted) {
          setAuthError("Googleでログインできませんでした。メールアドレスでログインしてください。");
        }
      }

      unsubscribe = onAuthStateChanged(auth, async (current) => {
        console.log("auth state changed", { hasUser: Boolean(current), uid: current?.uid || null });
        if (!mounted) return;

        if (current) {
          clearDemoSession();
          setUser(current);
          try {
            const nextProfile = await ensureUserProfile({
              id: current.uid,
              displayName: current.displayName || "",
              email: current.email || "",
            });
            if (!mounted) return;
            setProfile(nextProfile);
            setMode("cloud");
            setAuthError("");
          } catch (profileError) {
            console.error("login failed", profileError);
            if (!mounted) return;
            setAuthError("ログイン後の準備で時間がかかっています。少ししてからもう一度お試しください。");
          }
        } else {
          setDemoState(setUser, setProfile, setMode);
        }

        window.clearTimeout(timeoutId);
        endLoading();
      });
    }

    start().catch((error) => {
      console.error("auth bootstrap failed", error);
      if (mounted) {
        setAuthError("Googleでログインできませんでした。メールアドレスでログインしてください。");
        setDemoState(setUser, setProfile, setMode);
      }
      window.clearTimeout(timeoutId);
      endLoading();
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    setProfile,
    mode,
    authError,
    isDemoMode: mode === "demo",
    isCloudMode: mode === "cloud",
    isSignedIn: Boolean(user) && !isDemoUserId(user?.uid),
  };
}
