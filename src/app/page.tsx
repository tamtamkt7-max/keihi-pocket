import Link from "next/link";
import { Camera, FileText, ListChecks, PieChart } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

const steps = [
  {
    title: "写真で登録",
    text: "レシートを撮るか、保存済みの写真を選びます。日付、金額、お店・相手先を読み取り、登録内容に反映します。",
    icon: Camera,
  },
  {
    title: "内容を確認",
    text: "読み取れた内容を見て、必要なところだけ修正します。分類や記録の用途も保存前に選べます。",
    icon: ListChecks,
  },
  {
    title: "一覧と集計で見返す",
    text: "保存した記録は一覧や集計で確認できます。申告前に分類ごとの金額や未分類の記録を見返せます。",
    icon: PieChart,
  },
];

export default function Page() {
  return (
    <main className="page section public-page">
      <section className="card list-card public-hero">
        <span className="badge primary">経費ポケット</span>
        <div className="heading">
          <div>
            <h1>レシートを撮って、支払いと売上を整理</h1>
            <p className="subtitle">
              経費ポケットは、日々のレシートや売上を記録し、あとから一覧・集計で見返すための記録整理アプリです。
              確定申告前の確認にも使いやすいよう、分類や集計メモをまとめられます。
            </p>
          </div>
        </div>
        <div className="row">
          <Link href="/login" className="button primary">
            はじめる
          </Link>
          <Link href="/dashboard" className="button secondary">
            アプリを開く
          </Link>
        </div>
      </section>

      <section className="grid-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className="card list-card">
              <div className="action-card-icon">
                <Icon size={22} />
              </div>
              <h2>{step.title}</h2>
              <p className="subtitle">{step.text}</p>
            </article>
          );
        })}
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>申告前の確認に使いやすく</h2>
            <p className="subtitle">
              分類別の合計、月別の推移、未分類や要確認の記録を見返せます。PDFやCSVは確認用の集計メモとして出力できます。
              申告内容や税務判断は、必要に応じて税理士・税務署等に確認してください。
            </p>
          </div>
          <FileText size={28} />
        </div>
      </section>

      <section className="card list-card">
        <h2>公開ページ</h2>
        <p className="subtitle">サービスの利用前に確認できるページを用意しています。</p>
        <div className="settings-links">
          <Link href="/guide">使い方</Link>
          <Link href="/about">運営者情報</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/terms">利用規約</Link>
          <Link href="/contact">お問い合わせ</Link>
        </div>
      </section>

      <AdSlot placement="home-bottom" />
    </main>
  );
}
