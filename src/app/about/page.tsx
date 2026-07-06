import Link from "next/link";
import { Mail, ShieldAlert, User } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="page section public-page">
      <section className="card list-card public-hero">
        <span className="badge primary">運営者情報</span>
        <div className="heading">
          <div>
            <h1>運営者情報・プロフィール</h1>
            <p className="subtitle">
              「経費ポケット」の運営者情報および当サイトの目的について記載しています。
            </p>
          </div>
          <User size={30} />
        </div>
        <div className="row">
          <Link href="/" className="button primary">
            トップページへ
          </Link>
          <Link href="/contact" className="button secondary">
            お問い合わせ
          </Link>
        </div>
      </section>

      <section className="card list-card">
        <h2>運営者プロフィール</h2>
        <div className="settings-links" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <strong>運営者名:</strong> たむら (tamtamkt7)
          </div>
          <div>
            <strong>お問い合わせ先:</strong>{" "}
            <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "underline" }}>
              お問い合わせフォーム
            </Link>
            {" または "}
            <a href="mailto:toiawase.kt7@gmail.com" style={{ color: "var(--primary)", textDecoration: "underline" }}>
              toiawase.kt7@gmail.com
            </a>
          </div>
        </div>
      </section>

      <section className="card list-card">
        <h2>サイトの目的・概要</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          本サイト（経費ポケット）は、個人事業主やフリーランスの方々が日々の経費や売上をスマートフォンのカメラ等を用いて手軽に記録し、確定申告に向けた準備をサポートするためのサービスです。
          レシート画像からの自動読み取り機能等を提供し、家計簿や経費の整理にかかる時間を削減することを目指しています。
        </p>
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>免責事項</h2>
            <p className="subtitle" style={{ lineHeight: 1.7 }}>
              本サイトで提供するAIによる読み取り結果や自動分類、各種計算・集計データは、その正確性や安全性を保証するものではありません。
              本サイトを利用することによって生じたトラブルや損失・損害について、運営者は一切の責任を負いかねます。
              最終的な税務上の判断や確定申告書の作成につきましては、必要に応じて管轄の税務署または税理士等の専門家へご相談ください。
            </p>
          </div>
          <ShieldAlert size={28} />
        </div>
      </section>

      <section className="card list-card">
        <h2>その他の公開情報</h2>
        <div className="settings-links">
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/terms">利用規約</Link>
          <Link href="/guide">使い方</Link>
        </div>
      </section>
    </main>
  );
}
