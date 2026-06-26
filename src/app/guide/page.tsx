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
    text: "手元のレシートをその場で撮影し、読み取れた内容を確認して保存します。お財布にレシートがたまる前に、サッと記録を済ませたい時に最も便利な方法です。",
    icon: Camera,
  },
  {
    title: "写真から選ぶ",
    text: "すでにスマートフォンのカメラで撮ってあるレシート画像を選んで登録できます。外出先で連続して写真だけ撮っておき、あとでまとめて記録したい時に活用してください。",
    icon: ListChecks,
  },
  {
    title: "ファイルから選ぶ",
    text: "ファイルアプリなどに保存した画像から登録できます。もし画像が暗かったり、くしゃくしゃでうまく読み取れない時は、そのまま手入力に切り替えて記録を続けることができます。",
    icon: FileUp,
  },
  {
    title: "手入力",
    text: "自動販売機での支払いや、レシートが出ないお店での支払いも、日付・金額・お店・分類を直接入力して記録できます。現金払いなどの細かい記録も漏らさず残せます。",
    icon: PencilLine,
  },
];

const flow = [
  "カメラ、写真、ファイル、手入力の4つの方法から、その時に合った登録方法を選ぶ",
  "読み取られた日付・金額・お店・分類などの内容が、実際の支払いと合っているか確認する",
  "この支払いが仕事用か個人用かの用途を選び、正しい分類を設定して保存する",
  "保存した記録は、一覧や集計画面でいつでも確認し、必要に応じてCSVやPDFで出力する",
];

const outputUses = [
  "月ごとの売上や支払い、その差額をグラフや表でひと目で確認する",
  "分類ごとの合計金額を見て、入力漏れや未分類のままになっている記録を整える",
  "出力したCSVファイルを表計算ソフトで開き、申告前の細かい数字のチェックに使う",
  "PDFを出力して、過去の記録として見返すための確認用メモとして手元に保存する",
];

export default function GuidePage() {
  return (
    <main className="page section public-page">
      <section className="card list-card public-hero">
        <span className="badge primary">使い方と活用方法</span>
        <div className="heading">
          <div>
            <h1>レシートを記録して、あとから見返しやすく</h1>
            <p className="subtitle">
              経費ポケットは、日々の支払いと売上を写真や手入力でサッと残し、一覧・集計・出力で簡単に整理するための専用アプリです。
              確定申告の時期になってから大量のレシートを前に頭を抱えるのではなく、毎日少しずつ記録しておくことで、申告前に見返しやすい状態を作ることを目的にしています。
              スマートフォンひとつで、いつでもどこでも経費の管理を始めましょう。
            </p>
          </div>
          <CheckCircle2 size={30} />
        </div>
        <div className="row">
          <Link href="/records/new?entry=choose" className="button primary">
            さっそく登録する
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
            <h2>登録から確認までの流れ</h2>
            <p className="subtitle">
              どの方法で登録しても、いきなり保存されることはありません。必ず自分の目で内容を確認してから保存できる安心の設計です。
            </p>
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
            <h2>記録の用途（事業用と個人用の仕分け）</h2>
            <p className="subtitle">
              支払いを記録する際、「事業用の支払い」か「個人の支払い」かを選ぶことができます。
              仕事に関係する経費と、日々の家計の支払いが混ざってしまうのを防ぐための重要な機能です。
            </p>
          </div>
          <WalletCards size={28} />
        </div>
        <div className="settings-links">
          <span>事業用の支払い: お仕事や事業の運営に直接関係する支払いの整理に使います。</span>
          <span>個人の支払い: プライベートなお買い物や、家計の支払いを分けて残したい時に使います。</span>
        </div>
      </section>

      <section className="card list-card">
        <div className="heading">
          <div>
            <h2>CSV・PDF出力の活用方法</h2>
            <p className="subtitle">
              保存したすべての記録は、あとから集計画面で月ごとに振り返ることができます。
              出力機能は、そのまま公的な書類として提出するものではなく、入力内容が正しいかを見返すための確認用メモとして大いに役立ちます。
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
            <h2>申告前の整理と注意点</h2>
            <p className="subtitle">
              経費ポケットは、あくまでユーザーの皆様が日々の支払い状況を整理しやすくするためのサポートツールです。確定申告や税務判断をアプリが代わりに行うものではありません。
              AIによる読み取り結果や自動分類、集計結果は、保存前やデータ出力前に必ずご自身で内容をご確認ください。
              また、経費として計上できるかどうかの判断に迷う内容は、必要に応じて専門の税理士や管轄の税務署へ直接ご確認をお願いいたします。
            </p>
          </div>
          <PieChart size={28} />
        </div>
      </section>

      <AdSlot placement="home-bottom" />
    </main>
  );
}