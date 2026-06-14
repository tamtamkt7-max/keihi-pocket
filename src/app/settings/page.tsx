"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { signOutUser } from "@/lib/firebase/auth";
import { saveUserProfile } from "@/lib/firestore/users";
import { useAuth } from "@/hooks/useAuth";
import { settingsSchema } from "@/lib/validations/settingsSchema";
import { AdSlot } from "@/components/ads/AdSlot";

function getInitial(user: { displayName?: string | null; email?: string | null }) {
  const source = user.displayName || user.email || "?";
  return source.trim().charAt(0).toUpperCase();
}

export default function SettingsPage() {
  const { user, profile, setProfile, isDemoMode, isCloudMode } = useAuth();
  const [message, setMessage] = useState("");
  const plan = profile?.plan === "plus" ? "plus" : "free";

  if (!profile) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="page">
            <div className="card" style={{ padding: 24 }}>
              設定を開いています...
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader title="設定" description="アカウントと保存方法を確認します。" />

          <Card className="list-card">
            <div className="heading">
              <div>
                <h3>アカウント</h3>
                {isDemoMode ? (
                  <p className="subtitle" style={{ marginBottom: 0 }}>
                    お試し中です。必要になったらログインして続けられます。
                  </p>
                ) : (
                  <p className="subtitle" style={{ marginBottom: 0 }}>
                    {user?.email || "ログイン中"}
                  </p>
                )}
              </div>
              <span className="badge primary">{isDemoMode ? "お試し中" : "ログイン中"}</span>
            </div>

            {!isDemoMode && user ? (
              <div className="account-summary">
                {"photoURL" in user && user.photoURL ? (
                  <img src={user.photoURL} alt="" className="account-avatar account-avatar-large" />
                ) : (
                  <span className="account-avatar account-avatar-fallback account-avatar-large">{getInitial(user)}</span>
                )}
                <div>
                  <strong>{user.displayName || "アカウント"}</strong>
                  <div className="subtitle">{user.email || ""}</div>
                  <div className="subtitle">記録はこのアカウントで使えます。</div>
                </div>
              </div>
            ) : null}

            <div className="row" style={{ marginTop: 16 }}>
              {isDemoMode ? (
                <Link href="/login?next=/settings">
                  <Button>ログインして保存</Button>
                </Link>
              ) : (
                <Button variant="ghost" onClick={() => signOutUser()}>
                  ログアウト
                </Button>
              )}
            </div>
          </Card>

          <Card className="list-card">
            <div className="heading">
              <div>
                <h3>データの保存</h3>
                <p className="subtitle">
                  {isDemoMode
                    ? "今の記録はこの端末だけに保存されます。"
                    : "記録はログインしたアカウントに保存されます。"}
                </p>
              </div>
              <span className="badge primary">{isCloudMode ? "ログイン中" : "この端末のみ"}</span>
            </div>
            <div className="support-panel">
              <strong>画像について</strong>
              <span>今は登録内容の保存を優先しています。写真は保存されないことがあります。</span>
            </div>
          </Card>

          <Card id="plus-plan" className="list-card plus-plan-card">
            <div className="heading">
              <div>
                <h3>プラス</h3>
                <p className="subtitle">広告なしで、まとめ登録と申告前の整理をしやすくします。</p>
              </div>
              <span className="badge primary">{plan === "plus" ? "利用中" : "月額300円"}</span>
            </div>
            <div className="grid-2">
              <div className="support-panel">
                <strong>広告なし</strong>
                <span>画面下部の広告を気にせず使えます。</span>
              </div>
              <div className="support-panel">
                <strong>高精度読み取り 月100件</strong>
                <span>レシートをまとめて登録しやすくします。</span>
              </div>
              <div className="support-panel">
                <strong>CSV/PDF出力強化</strong>
                <span>あとから見返しやすい形で整理します。</span>
              </div>
              <div className="support-panel">
                <strong>申告前の整理</strong>
                <span>分類や集計を確認しやすくします。</span>
              </div>
            </div>
            <div className="row">
              <Link href="/contact">
                <Button variant="secondary">プラスについて問い合わせる</Button>
              </Link>
            </div>
          </Card>

          <Card className="list-card">
            <div className="heading">
              <div>
                <h3>事業の設定</h3>
                <p className="subtitle">あとから見返しやすいように、基本の設定をそろえておけます。</p>
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>事業名</label>
                <Input
                  value={profile.businessName}
                  onChange={(e) => setProfile((prev: any) => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>年度の始まり</label>
                <Select
                  value={String(profile.fiscalYearStartMonth)}
                  onChange={(e) => setProfile((prev: any) => ({ ...prev, fiscalYearStartMonth: Number(e.target.value) }))}
                >
                  {Array.from({ length: 12 }).map((_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}月
                    </option>
                  ))}
                </Select>
              </div>
              <div className="field">
                <label>いつもの事業割合</label>
                <Input
                  type="number"
                  value={profile.defaultBusinessUsePercent}
                  onChange={(e) => setProfile((prev: any) => ({ ...prev, defaultBusinessUsePercent: Number(e.target.value) }))}
                />
              </div>
              <div className="field">
                <label>いつもの税の設定</label>
                <Select
                  value={profile.defaultTaxType}
                  onChange={(e) => setProfile((prev: any) => ({ ...prev, defaultTaxType: e.target.value }))}
                >
                  <option value="inclusive">税込</option>
                  <option value="exclusive">税抜</option>
                  <option value="none">対象外</option>
                </Select>
              </div>
            </div>

            <div className="row">
              <Button
                onClick={async () => {
                  const parsed = settingsSchema.safeParse(profile);
                  if (!parsed.success) {
                    setMessage(parsed.error.issues[0]?.message || "入力内容を確認してください。");
                    return;
                  }
                  try {
                    await saveUserProfile(profile);
                    setMessage("保存しました。");
                  } catch {
                    setMessage("保存できませんでした。通信状況を確認して、もう一度お試しください。");
                  }
                }}
              >
                保存する
              </Button>
            </div>
            {message ? <div className="subtitle">{message}</div> : null}
          </Card>

          <Card className="list-card">
            <div className="heading">
              <div>
                <h3>案内</h3>
                <p className="subtitle">困ったときや確認したいときはこちら。</p>
              </div>
            </div>
            <div className="settings-links">
              <Link href="/privacy">プライバシーポリシー</Link>
              <Link href="/terms">利用規約</Link>
              <Link href="/contact">お問い合わせ</Link>
              <a href="#plus-plan">広告なしプラン</a>
              <span>バージョン 0.1.0</span>
            </div>
          </Card>

          <AdSlot placement="settings" />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
