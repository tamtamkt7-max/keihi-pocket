"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { signInWithGoogle, startDemoMode } from "@/lib/firebase/auth";

type Props = {
  mode: "cloud" | "demo";
  onError?: (message: string) => void;
};

export function LoginButton({ mode, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const label =
    mode === "cloud"
      ? loading
        ? "ログイン中..."
        : "Googleで続ける"
      : loading
        ? "準備中..."
        : "お試しで使う";

  return (
    <Button
      variant={mode === "cloud" ? "primary" : "secondary"}
      onClick={async () => {
        try {
          setLoading(true);
          if (mode === "cloud") {
            const result = await signInWithGoogle();
            if (result.mode === "popup") {
              router.replace("/dashboard");
            }
            return;
          }

          await startDemoMode();
          router.replace("/dashboard");
        } catch (error) {
          console.error("login failed", error);
          onError?.(
            error instanceof Error
              ? error.message
              : mode === "cloud"
                ? "ログインできませんでした。もう一度お試しください。"
                : "お試しを始められませんでした。もう一度お試しください。"
          );
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="w-full"
    >
      {label}
    </Button>
  );
}
