import Link from "next/link";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <main className="page section public-page">
      <section className="card list-card public-hero">
        <span className="badge primary">規約</span>
        <div className="heading">
          <div>
            <h1>利用規約</h1>
            <p className="subtitle">
              当サイト（経費ポケット）の利用条件および免責事項について定めています。
            </p>
          </div>
          <FileText size={30} />
        </div>
        <div className="row">
          <Link href="/" className="button primary">
            トップページへ
          </Link>
          <Link href="/privacy" className="button secondary">
            プライバシーポリシー
          </Link>
        </div>
      </section>

      <section className="card list-card">
        <h2>1. サービスの目的と提供内容</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          当サイトは、ユーザーがアップロードしたレシート画像を解析して金額や日付などの情報を自動で読み取り、日々の支払い・売上の整理・集計をサポートするサービスです。
        </p>
        <p className="subtitle" style={{ lineHeight: 1.7, marginTop: 8 }}>
          当サイトが提供する解析結果や自動分類は補助的なものであり、確定申告等の公的な書類提出や税務上の最終的な判断は、ユーザーご自身の責任のもとで行っていただくものとします。
        </p>
      </section>

      <section className="card list-card">
        <h2>2. 禁止事項</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          ユーザーは、当サイトの利用にあたり、以下の行為を行ってはなりません。
        </p>
        <ul className="guide-list" style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>法令または公序良俗に反する行為、またはその恐れのある行為</li>
          <li>当サイトのサーバーやネットワークの機能を破壊したり、不当に負荷をかけたりする行為</li>
          <li>他のユーザーに対する不正アクセスや、個人情報を無断で収集・蓄積する行為</li>
          <li>その他、運営者が不適切と判断する一切の行為</li>
        </ul>
      </section>

      <section className="card list-card">
        <h2>3. 免責事項</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          当サイトにおけるAIによる文字解析結果や自動分類データについて、その適合性、正確性、完全性、最新性等を保証するものではありません。
        </p>
        <p className="subtitle" style={{ lineHeight: 1.7, marginTop: 8 }}>
          当サイトの利用または利用不能により生じた直接的、間接的、偶発的、特別、または結果的な損害（データの消失、事業の中断、経済的損失等）に関して、運営者は一切の責任を負いません。
        </p>
      </section>

      <section className="card list-card">
        <h2>4. 規約の変更</h2>
        <p className="subtitle" style={{ lineHeight: 1.7 }}>
          運営者は、必要と判断した場合には、ユーザーに事前通知することなくいつでも本規約を変更することができるものとします。本規約の変更後、ユーザーが当サイトを利用した場合は、変更後の規約に同意したものとみなします。
        </p>
      </section>

      <section className="card list-card">
        <h2>その他の公開情報</h2>
        <div className="settings-links">
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/about">運営者情報</Link>
          <Link href="/guide">使い方</Link>
        </div>
      </section>
    </main>
  );
}