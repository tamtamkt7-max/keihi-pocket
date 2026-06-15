import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  FileDown,
  FileUp,
  ListChecks,
  PencilLine,
  PieChart,
  WalletCards,
} from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

const entryMethods = [
  {
    title: "カメラで撮る",
    text: "手元のレシートをその場で撮影し、読み取れた内容を確認して保存します。",
    icon: Camera,
  },
  {
    title: "写真から選ぶ",
    text: "すでに撮ってあるレシート画像を選んで登録できます。",
    icon: ListChecks,
  },
  {
    title: "ファイルから選ぶ",
    text: "ファイルアプリなどに保存した画像から登録できます。読み取れない時は手入力に切り替えられます。",
    icon: FileUp,
  },
  {
    title: "手入力",
    text: "写真がない支払いも、日付・金額・お店・分類を入力して記録できます。",
    icon: PencilLine,
  },
];

const flow = [
  "カメラ、写真、ファイル、手入力から登録方法を選ぶ",
  "日付・金額・お店・分類など、読み取れた内容を確認する",
  "記録の用途と分類を選んで保存する",
  "一覧、集計、CSV/PDFであとから見返す",
];

const outputUses = [
  "月ごとの売上・支払い・差額を確認する",
  "分類ごとの合計を見て、未分類の記録を直す",
  "CSVを表計算ソフトで開き、必要な項目を確認する",
  "PDFを申告前の確認用メモとして保存する",
];

export default function GuidePage() {
  return (
    <main className="page section public-page">
      <section className="card list-card public-hero">
        <span className="badge primary">使い方</span>
        <div className="heading">
          <div>
            <h1>レシートを記録して、あとから見返しやすく</h1>
            <p className="subtitle">
              経費ポケットは、日々の支払いと売上を写真や手入力で残し、一覧・集計・出力で整理するためのアプリです。
              レシートをため込まず、申告前に見返しやすい状態を作ることを目的にしています。
            </p>
          </div>
          <CheckCircle2 size={30} />
        </div>
        <div className="row">
          <Link href="/records/new?entry=choose" className="button primary">
            登録する
          </Link>
          <Link href="/dashboard" className="button secondary">
            アプリを開く
          </Link>
        </div>
      </section>

      <section className="grid-3">
        {entryMethods.map((method) => {
          const Icon = method.icon;
          return (
            <article key={method.title} className="card list-card">
              <div className="action-card-icon">
                <Icon size={22} />
              </div>
              <h2>{method.title}</h2>
              <p className="subtitle">{method.text}</p>
            </article>
          );
        })}
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>登録の流れ</h2>
            <p className="subtitle">写真登録でも手入力でも、保存前に内容を確認できます。</p>
          </div>
          <Camera size={28} />
        </div>
        <ol className="guide-list">
          {flow.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>記録の用途</h2>
            <p className="subtitle">
              登録時に「事業用の支払い」と「個人の支払い」を選べます。仕事に関係する支払いか、個人の支払いとして残すかを、
              保存前に自分で確認して選ぶための項目です。
            </p>
          </div>
          <WalletCards size={28} />
        </div>
        <div className="settings-links">
          <span>事業用の支払い: 仕事や事業に関係する支払いの整理に使います。</span>
          <span>個人の支払い: 家計や個人用の支払いを分けて残したい時に使います。</span>
        </div>
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>CSV/PDF出力</h2>
            <p className="subtitle">
              保存した記録は、あとから集計画面で確認できます。CSVやPDFは、そのまま提出する書類ではなく、
              入力前に内容を見返すための確認用メモとして使えます。
            </p>
          </div>
          <FileDown size={28} />
        </div>
        <ul className="guide-list">
          {outputUses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>申告前の整理に</h2>
            <p className="subtitle">
              経費ポケットは、確定申告や税務判断を代わりに行うものではありません。
              読み取り結果、分類、集計結果は保存前や出力前に確認してください。
              判断に迷う内容は、必要に応じて税理士や税務署などへご確認ください。
            </p>
          </div>
          <PieChart size={28} />
        </div>
      </section>

      <AdSlot placement="home-bottom" />
    </main>
  );
}
