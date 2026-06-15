import Link from "next/link";
import { Camera, CheckCircle2, FileUp, ListChecks, PencilLine, PieChart } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

const entryMethods = [
  {
    title: "カメラで撮る",
    text: "その場でレシートを撮って、読み取れた内容を確認します。",
    icon: Camera,
  },
  {
    title: "写真から選ぶ",
    text: "保存済みのレシート画像から登録できます。",
    icon: ListChecks,
  },
  {
    title: "ファイルから選ぶ",
    text: "ファイルアプリ内の画像を選んで登録できます。",
    icon: FileUp,
  },
  {
    title: "手入力",
    text: "写真がない支払いも、日付や金額を入力して残せます。",
    icon: PencilLine,
  },
];

const flow = [
  "レシートを撮る、または画像を選ぶ",
  "読み取れた内容を確認する",
  "用途や分類を選んで保存する",
  "一覧や集計で見返す",
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
              経費ポケットは、日々の支払いを写真や手入力で残し、一覧・集計・出力で整理するためのアプリです。
              申告前の確認に使いやすいよう、分類や用途も一緒に保存できます。
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
            <p className="subtitle">写真登録でも手入力でも、最後は内容を確認してから保存します。</p>
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
            <h2>申告前の整理に</h2>
            <p className="subtitle">
              保存した記録は、分類ごとの集計やCSV/PDFの確認用メモとして出力できます。
              申告書そのものではないため、内容を確認し、必要に応じて専門家や公的窓口へご確認ください。
            </p>
          </div>
          <PieChart size={28} />
        </div>
      </section>

      <AdSlot placement="home-bottom" />
    </main>
  );
}
