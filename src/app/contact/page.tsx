"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { saveContact } from "@/lib/firestore/contacts";

export default function ContactPage() {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ユーザーがログイン状態の場合、初期値をセットする
  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setEmail(profile.email || "");
    } else if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user, profile]);

  // document.titleの設定
  useEffect(() => {
    document.title = "お問い合わせ - 経費ポケット";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      setErrorMessage("メールアドレスとお問い合わせ内容は必須です。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    let deviceInfo = "";
    if (typeof window !== "undefined") {
      deviceInfo = `UserAgent: ${window.navigator.userAgent}, Platform: ${window.navigator.platform}`;
    }

    try {
      // APIルート /api/contact を経由してメール送信とFirestore保存を実行
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
          deviceInfo,
        }),
      });

      if (!response.ok) {
        // APIエラー時は、直接のFirestore/ローカル保存ヘルパーでの保存を試みる（Fail-Safe）
        console.warn("API route failed. Falling back to direct database save.");
        await saveContact({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
          deviceInfo,
        });
      }

      setIsSuccess(true);
      setMessage(""); // フォームクリア
    } catch (error) {
      console.error("Failed to send contact via API:", error);
      // ネットワーク切断時などのフェイルセーフ
      try {
        console.log("Attempting direct save fallback");
        await saveContact({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
          deviceInfo,
        });
        setIsSuccess(true);
        setMessage("");
      } catch (fallbackError) {
        console.error("Direct save fallback failed:", fallbackError);
        setErrorMessage("お問い合わせを送信できませんでした。電波の良い場所で再度お試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell hideNav={!user}>
      <div className="page section legal-page">
        <PageHeader title="お問い合わせ" description="困ったときや確認したいことがあるときはこちら。" />

        {isSuccess ? (
          <Card className="list-card" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>✉️</div>
            <h3 style={{ marginBottom: 12 }}>お問い合わせを送信しました</h3>
            <p className="subtitle" style={{ marginBottom: 24, lineHeight: 1.6 }}>
              ご連絡いただきありがとうございます。<br />
              内容を確認し、返信が必要な場合はメールアドレス宛てにご連絡いたします。<br />
              （個人で運営しているため、お時間をいただく場合があります。）
            </p>
            <Button onClick={() => setIsSuccess(false)}>新しく問い合わせる</Button>
          </Card>
        ) : (
          <Card className="list-card">
            <h3>お問い合わせフォーム</h3>
            <p className="subtitle" style={{ marginBottom: 20 }}>
              以下のフォームに入力して「送信する」を押してください。
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label>お名前</label>
                <Input
                  type="text"
                  placeholder="例: 山田 太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="field">
                <label>返信用メールアドレス <span style={{ color: "red" }}>*</span></label>
                <Input
                  type="email"
                  placeholder="例: mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="field">
                <label>お問い合わせの種類</label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="general">使い方について</option>
                  <option value="plus">プラスプランについて</option>
                  <option value="bug">不具合・改善のご要望</option>
                  <option value="other">その他</option>
                </Select>
              </div>

              <div className="field">
                <label>お問い合わせ内容 <span style={{ color: "red" }}>*</span></label>
                <Textarea
                  placeholder="困っていることや、ご要望を具体的にお書きください。"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  required
                  rows={6}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)" }}
                />
              </div>

              {errorMessage && (
                <div style={{ color: "red", fontSize: "0.9rem", marginTop: 8 }}>
                  {errorMessage}
                </div>
              )}

              <div className="row" style={{ marginTop: 8 }}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "送信中..." : "送信する"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="list-card legal-section">
          <h3>メールで直接問い合わせる場合</h3>
          <p>
            フォームが動かない場合や、添付ファイルを送りたい場合は、次のメールアドレスまで直接ご連絡ください。
          </p>
          <p style={{ marginTop: 8, fontWeight: "bold" }}>
            <a href="mailto:toiawase.kt7@gmail.com" style={{ color: "var(--primary)", textDecoration: "underline" }}>
              toiawase.kt7@gmail.com
            </a>
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>ご連絡いただきたい内容</h3>
          <ul className="legal-list">
            <li>利用端末（例: iPhone、Android、PC）</li>
            <li>発生した画面（例: 登録、一覧、集計、ログイン）</li>
            <li>何をしよとしたか、表示されたエラー内容など</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
