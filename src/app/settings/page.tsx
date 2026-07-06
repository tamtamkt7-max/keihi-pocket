"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
import { Modal } from "@/components/ui/Modal";
import { UserProfile } from "@/types/user";

function getInitial(user: { displayName?: string | null; email?: string | null }) {
  const source = user.displayName || user.email || "?";
  return source.trim().charAt(0).toUpperCase();
}

export default function SettingsPage() {
  const { user, profile, setProfile, isDemoMode, isCloudMode } = useAuth();
  const [message, setMessage] = useState("");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");
  const plan = profile?.plan === "plus" ? "plus" : "free";

  const isStripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const useStripe = isCloudMode && isStripeConfigured;

  // Stripe遷移結果の検出
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const stripeStatus = searchParams.get("stripe");
      
      if (stripeStatus === "success") {
        setStripeMessage("決済手続きが完了しました。プラスプランをご利用いただけます！");
        
        const updatePlanToPlus = async () => {
          if (profile && profile.plan !== "plus") {
            const updatedProfile: UserProfile = {
              ...profile,
              plan: "plus",
              subscriptionStatus: "active",
            };
            try {
              await saveUserProfile(updatedProfile);
              setProfile(updatedProfile);
            } catch (err) {
              console.error("Failed to update profile locally after Stripe success:", err);
            }
          }
        };
        updatePlanToPlus();
        
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else if (stripeStatus === "cancel") {
        setStripeMessage("決済がキャンセルされました。");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [profile, setProfile]);

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

          {stripeMessage && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: stripeMessage.includes("完了") ? "#e6fffa" : "#fff5f5",
              color: stripeMessage.includes("完了") ? "#006d5b" : "#e53e3e",
              border: stripeMessage.includes("完了") ? "1px solid #b2f5ea" : "1px solid #fed7d7",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: "0.95rem",
              fontWeight: "bold",
            }}>
              {stripeMessage}
            </div>
          )}

          <Card id="plus-plan" className="list-card plus-plan-card">
            <div className="heading">
              <div>
                <h3>プラスプラン</h3>
                <p className="subtitle">広告なしで、まとめ登録と申告前の整理をしやすくします。</p>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "12px 16px", 
              backgroundColor: "var(--bg-muted, #f3f4f6)", 
              borderRadius: 8, 
              marginBottom: 16 
            }}>
              <div>
                <span className="subtitle" style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>ご契約中のプラン</span>
                <strong style={{ fontSize: "1.1rem" }}>
                  現在のプラン：{plan === "plus" ? "プラスプラン (広告非表示・機能制限解除)" : "フリープラン (広告表示・機能制限あり)"}
                </strong>
              </div>
              <div>
                {plan === "plus" ? (
                  <span className="badge success">利用中</span>
                ) : (
                  <span className="badge primary">未加入 (月額300円)</span>
                )}
              </div>
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
              <Button 
                variant={plan === "plus" ? "secondary" : "primary"}
                onClick={() => setIsPlanModalOpen(true)}
              >
                {plan === "plus" ? "フリープランに戻す" : "プラスプランに変更する"}
              </Button>
            </div>
          </Card>

          <Modal
            open={isPlanModalOpen}
            title={plan === "plus" ? "プランの変更（解約）" : "プランの変更（プラス）"}
            onClose={() => !isUpdatingPlan && setIsPlanModalOpen(false)}
          >
            <div style={{ padding: "8px 0" }}>
              {isUpdatingPlan ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 16 }}>
                  <div className="modal-spinner" style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--primary)",
                    animation: "modal-spin 1s linear infinite"
                  }} />
                  <span style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: "bold", textAlign: "center", lineHeight: 1.6 }}>
                    {useStripe 
                      ? "決済システム（Stripe）へ移動しています。\nそのまましばらくお待ちください..."
                      : "プラン情報を更新しています。\nしばらくお待ちください..."}
                  </span>
                  <style>{`
                    @keyframes modal-spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : (
                <>
                  {plan === "plus" ? (
                    <>
                      <p style={{ lineHeight: 1.6, marginBottom: 20 }}>
                        {useStripe 
                          ? "プラスプランの管理画面に移動します。Stripeのマイページへ遷移します。よろしいですか？"
                          : "広告なしプラスプランを終了し、フリープランへ変更します。よろしいですか？"}
                      </p>
                      <p className="subtitle" style={{ fontSize: "0.85rem", marginBottom: 24 }}>
                        ※変更後は、月100件以上のOCR読み取りや高度な出力機能に制限が適用され、広告が表示されるようになります。
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ lineHeight: 1.6, marginBottom: 20 }}>
                        {useStripe
                          ? "広告なしプラスプラン（月額300円）の決済画面へ移動します。よろしいですか？"
                          : "広告なしプラスプラン（月額300円）に変更します。よろしいですか？"}
                      </p>
                      <p className="subtitle" style={{ fontSize: "0.85rem", marginBottom: 24 }}>
                        {useStripe 
                          ? "※Stripeの決済ページヘ遷移します。"
                          : "※デモ環境のため、実際の決済や請求は発生しません。"}
                      </p>
                    </>
                  )}

                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
                    <Button
                      variant="ghost"
                      onClick={() => setIsPlanModalOpen(false)}
                      disabled={isUpdatingPlan}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={async () => {
                        setIsUpdatingPlan(true);
                        try {
                          if (useStripe && profile) {
                            if (plan === "free") {
                              const res = await fetch("/api/stripe/checkout", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: profile.id, email: profile.email }),
                              });
                              const data = await res.json();
                              if (data.url) {
                                window.location.href = data.url;
                                return;
                              } else {
                                throw new Error(data.error || "Checkout session creation failed");
                              }
                            } else {
                              if (profile.stripeCustomerId) {
                                const res = await fetch("/api/stripe/portal", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ stripeCustomerId: profile.stripeCustomerId }),
                                });
                                const data = await res.json();
                                if (data.url) {
                                  window.location.href = data.url;
                                  return;
                                } else {
                                  throw new Error(data.error || "Billing portal session creation failed");
                                }
                              }
                            }
                          }

                          // Stripe設定が無い、またはデモフォールバックの場合
                          const nextPlan: "free" | "plus" = plan === "plus" ? "free" : "plus";
                          const nextStatus: "active" | "inactive" = nextPlan === "plus" ? "active" : "inactive";
                          const updatedProfile: UserProfile = {
                            ...profile,
                            plan: nextPlan,
                            subscriptionStatus: nextStatus,
                          };
                          await saveUserProfile(updatedProfile);
                          setProfile(updatedProfile);
                          setIsPlanModalOpen(false);
                        } catch (error: any) {
                          console.error("Failed to update plan:", error);
                          alert(error.message || "プランの変更に失敗しました。通信状態を確認してください。");
                        } finally {
                          setIsUpdatingPlan(false);
                        }
                      }}
                      disabled={isUpdatingPlan}
                    >
                      変更する
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Modal>

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

        </div>
      </AppShell>
    </AuthGuard>
  );
}
