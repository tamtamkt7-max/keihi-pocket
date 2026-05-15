import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <AppShell>
      <div className="page section legal-page">
        <PageHeader title="利用規約" description="経費ポケットをご利用いただく際のお願いです。" />

        <Card className="list-card legal-section">
          <h3>1. サービス内容</h3>
          <p>
            経費ポケットは、レシート、経費、売上などの記録と整理を助けるアプリです。保存した内容を一覧や集計で見返し、
            日々の記録を続けやすくすることを目的としています。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>2. 税務判断について</h3>
          <p>
            本サービスは、確定申告の完了や税務上の判断を保証するものではありません。申告内容や経費にできる範囲などは、
            必要に応じて税理士、税務署、その他の専門窓口にご確認ください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>3. 入力内容の確認</h3>
          <p>
            写真から入った内容、手入力した内容、集計結果は、ご自身で確認してからご利用ください。日付、金額、相手先、
            分類などに誤りがある場合は、編集画面で直してください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>4. 禁止事項</h3>
          <ul className="legal-list">
            <li>不正な目的で本サービスを利用する行為</li>
            <li>他者の情報を無断で登録する行為</li>
            <li>本サービスの運営を妨げる行為</li>
            <li>法令または公序良俗に反する行為</li>
          </ul>
        </Card>

        <Card className="list-card legal-section">
          <h3>5. データについて</h3>
          <p>
            ログインして使う場合、入力した記録はオンライン上に保存されます。お試し中の記録は端末に依存するため、
            端末の変更、ブラウザの設定変更、データ削除などにより見られなくなる場合があります。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>6. サービスの変更・停止</h3>
          <p>
            機能改善、保守、障害対応などにより、サービス内容の変更や一時停止が発生する場合があります。
            大きな変更がある場合は、アプリ内または関連ページでご案内します。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>7. 免責</h3>
          <p>
            本サービスでは、読み取り誤り、入力誤り、集計結果の誤差、データの消失、税務上の不利益などについて、
            法令で認められる範囲で過度な保証は行いません。大切な内容は、必要に応じて控えを保管してください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>8. 広告について</h3>
          <p>
            本サービスでは、画面の一部に広告が表示される場合があります。登録作業中の使いやすさを損なわないよう、
            表示場所を調整しながら運用します。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>9. お問い合わせ</h3>
          <p>
            ご不明な点は、<a href="mailto:toiawase.kt7@gmail.com">toiawase.kt7@gmail.com</a> までご連絡ください。
            詳しい案内は <Link href="/contact">お問い合わせ</Link> ページをご確認ください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>10. 改定について</h3>
          <p>
            本規約は、必要に応じて変更することがあります。変更後の内容は、このページでご案内します。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
