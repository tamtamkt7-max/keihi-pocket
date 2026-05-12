"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import {
  consumePostLoginPath,
  registerWithEmail,
  resetPassword,
  setPostLoginPath,
  signInWithEmail,
} from "@/lib/firebase/auth";
import { firebaseEnabled } from "@/lib/runtime/appMode";

type EmailMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, authError, isCloudMode } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard");

  const canResetPassword = useMemo(() => email.trim().length > 0, [email]);

  useEffect(() => {
    console.log("login page mounted");
    console.log("firebase config available", { enabled: firebaseEnabled });

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/dashboard";
    setNextPath(next);
    setPostLoginPath(next);
  }, []);

  useEffect(() => {
    if (!loading && user && isCloudMode) {
      router.replace(consumePostLoginPath());
    }
  }, [loading, user, isCloudMode, router]);

  useEffect(() => {
    console.log("login page render ready", {
      loading,
      hasUser: Boolean(user),
      isCloudMode,
    });
  }, [loading, user, isCloudMode]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }

    if (!password) {
      setError("パスワードを入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      if (emailMode === "login") {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      router.replace(nextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ログインできませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("再設定メールを送るメールアドレスを入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage("パスワード再設定メールを送りました。");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "再設定メールを送れませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell hideNav>
      <div className="page login-screen">
        <Card className="login-card">
          <div className="section">
            <div className="login-brand">
              <span className="badge primary">経費ポケット</span>
              <h1 style={{ margin: "0 0 8px" }}>レシート管理を、もっとかんたんに。</h1>
              <p className="subtitle" style={{ margin: 0 }}>
                レシートを撮って、内容を確認して保存。あとから一覧や集計でまとめて見返せます。
              </p>
            </div>

            <Card className="list-card login-flow-card">
              <div className="heading" style={{ marginBottom: 0 }}>
                <div>
                  <h3>使い方はこの流れです。</h3>
                  <p className="subtitle">はじめてでも、数分で使い始められます。</p>
                </div>
              </div>
              <ol className="guide-steps" aria-label="使い方">
                <li>
                  <span>1</span>
                  <strong>レシートを撮る</strong>
                </li>
                <li>
                  <span>2</span>
                  <strong>内容を確認する</strong>
                </li>
                <li>
                  <span>3</span>
                  <strong>保存して集計を見る</strong>
                </li>
              </ol>
            </Card>

            <div className="stack-sm">
              {firebaseEnabled ? (
                <>
                  <div className="card login-panel">
                    <div className="stack-sm">
                      <div>
                        <strong>ログインすると、スマホやPCでも記録を見られます。</strong>
                        <div className="subtitle" style={{ marginTop: 6 }}>
                          まずは Google でそのまま始められます。
                        </div>
                      </div>
                      <LoginButton mode="cloud" onError={setError} />
                    </div>
                  </div>

                  <div className="login-divider">
                    <span>またはメールアドレスでログイン</span>
                  </div>

                  <Card className="list-card">
                    <div className="login-toggle">
                      <button
                        type="button"
                        className={emailMode === "login" ? "active" : ""}
                        onClick={() => {
                          setEmailMode("login");
                          setError("");
                          setMessage("");
                        }}
                      >
                        ログイン
                      </button>
                      <button
                        type="button"
                        className={emailMode === "register" ? "active" : ""}
                        onClick={() => {
                          setEmailMode("register");
                          setError("");
                          setMessage("");
                        }}
                      >
                        新規登録
                      </button>
                    </div>

                    <form className="stack-sm" onSubmit={handleEmailSubmit}>
                      <div className="field">
                        <label htmlFor="login-email">メールアドレス</label>
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="login-password">パスワード</label>
                        <Input
                          id="login-password"
                          type="password"
                          autoComplete={emailMode === "login" ? "current-password" : "new-password"}
                          placeholder="6文字以上"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                        />
                      </div>

                      <Button type="submit" disabled={submitting}>
                        {submitting ? "処理中..." : emailMode === "login" ? "ログインする" : "登録する"}
                      </Button>

                      <div className="row login-help-row">
                        <button
                          type="button"
                          className="text-button"
                          onClick={handlePasswordReset}
                          disabled={submitting || !canResetPassword}
                        >
                          パスワードを忘れたとき
                        </button>
                      </div>
                    </form>
                  </Card>

                  <div className="card login-panel login-panel-warm">
                    <div className="stack-sm">
                      <div>
                        <strong>まずはお試しで使う</strong>
                        <div className="subtitle" style={{ marginTop: 6 }}>
                          今の記録はこの端末だけに保存されます。あとからログインして続けられます。
                        </div>
                      </div>
                      <LoginButton mode="demo" onError={setError} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="card login-panel login-panel-warm">
                  <div className="stack-sm">
                    <div>
                      <strong>まずはお試しで使う</strong>
                      <div className="subtitle" style={{ marginTop: 6 }}>
                        今はこの端末だけで使えます。あとからログインを追加することもできます。
                      </div>
                    </div>
                    <LoginButton mode="demo" onError={setError} />
                  </div>
                </div>
              )}
            </div>

            {message ? (
              <div className="card success-card" style={{ padding: 14 }}>
                {message}
              </div>
            ) : null}

            {error || authError ? (
              <div className="card error-card" style={{ padding: 14 }}>
                {error || authError}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
