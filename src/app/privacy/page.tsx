import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="page section public-page">
      <section className="card list-card public-hero">
        <span className="badge primary">ポリシー</span>
        <div className="heading">
          <div>
            <h1>プライバシーポリシー</h1>
            <p className="subtitle">
              当サイト（経費ポケット）における個人情報の取り扱いおよび保護方針について説明します。
            </p>
          </div>
          <ShieldCheck size={30} />
        </div>
        <div className="row">
          <Link href="/" className="button primary">
            トップページへ
          </Link>
          <Link href="/terms" className="button secondary">
            利用規約
          </Link>
        </div>
      </section>

      <section className="card list-card">
        <h2>1. 個人情報の取得と利用目的</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          当サイトでは、Googleアカウントによる認証ログイン情報（お名前、メールアドレス、アイコン画像等）、およびユーザーがアップロードしたレシート画像データを取得します。
        </p>
        <p className="subtitle" style={{ lineHeight: 1.7, marginTop: 8 }}>
          これらの情報は、レシートからの金額や日付の自動読み取り機能、およびユーザーご自身が記録を管理・整理するための機能（本アプリのコア機能）の提供・運営のためにのみ利用し、それ以外の目的には使用いたしません。
        </p>
      </section>

      <section className="card list-card">
        <h2>2. 広告の配信について</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          当サイトでは、第三者配信の広告サービス「Google AdSense」を利用しています。
        </p>
        <p className="subtitle" style={{ lineHeight: 1.7, marginTop: 8 }}>
          広告配信事業者は、ユーザーの過去のアクセス情報に基づいて適切な広告を表示するために、Cookie（クッキー）を使用することがあります。
        </p>
        <p className="subtitle" style={{ lineHeight: 1.7, marginTop: 8 }}>
          ユーザーは、Googleの<a href="https://adssettings.google.com/authenticated" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>広告設定</a>にて、パーソナライズ広告を無効にすることができます。また、<a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>www.aboutads.info</a> にアクセスすることで、第三者配信事業者がパーソナライズ広告の掲載に使用する Cookie を無効にすることもできます。
        </p>
      </section>

      <section className="card list-card">
        <h2>3. データの保存と安全管理</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          アップロードされたレシート画像や記録データは、安全なクラウドデータベースに保管され、ユーザーご自身でいつでも自由に変更・削除が可能です。
          当サイトは、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報やアップロードされたデータを提供することはありません。
        </p>
      </section>

      <section className="card list-card">
        <h2>4. プライバシーポリシーの改定</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          当サイトは、本プライバシーポリシーの内容を適宜見直し、その改善に努めます。改定された最新のプライバシーポリシーは、常に本ページにて開示されます。
        </p>
      </section>

      <section className="card list-card">
        <h2>その他の公開情報</h2>
        <div className="settings-links">
          <Link href="/terms">利用規約</Link>
          <Link href="/about">運営者情報</Link>
          <Link href="/guide">使い方</Link>
        </div>
      </section>
    </main>
  );
}