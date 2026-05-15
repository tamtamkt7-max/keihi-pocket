import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="page section legal-page">
        <PageHeader
          title="プライバシーポリシー"
          description="経費ポケットで取り扱う情報についてご案内します。"
        />

        <Card className="list-card legal-section">
          <h3>1. 取得する情報</h3>
          <p>
            経費ポケットでは、ログイン時のメールアドレスなどのアカウント情報のほか、売上・経費の記録に必要な日付、金額、
            店名や相手先、分類、メモなどの情報を扱います。
          </p>
          <p>
            写真で登録する場合は、レシート画像や読み取りのために必要なデータを扱うことがあります。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>2. 利用目的</h3>
          <ul className="legal-list">
            <li>記録の保存と、一覧・集計・詳細画面での表示</li>
            <li>レシート内容の読み取りと入力補助</li>
            <li>CSVやPDFなど、確認用データの作成</li>
            <li>お問い合わせへの対応</li>
            <li>使いやすさの改善や不具合の確認</li>
          </ul>
        </Card>

        <Card className="list-card legal-section">
          <h3>3. 保存場所</h3>
          <p>
            ログインして使う場合、記録内容はオンライン上に保存されます。お試し中の記録は、この端末の中だけに保存されます。
          </p>
          <p>
            写真の保存は現時点では必須ではありません。内容の保存を優先しており、利用状況によっては写真を保存しない場合があります。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>4. 外部サービスの利用</h3>
          <p>経費ポケットでは、次の外部サービスを利用することがあります。</p>
          <ul className="legal-list">
            <li>Googleログイン</li>
            <li>Google Cloud Vision API によるレシート内容の読み取り</li>
            <li>Google AdSense による広告配信</li>
            <li>Vercel によるホスティング</li>
            <li>Firebase による認証とデータ保存</li>
          </ul>
        </Card>

        <Card className="list-card legal-section">
          <h3>5. 広告について</h3>
          <p>
            本サービスでは、広告の表示や配信のために Cookie などが利用される場合があります。広告の仕組みについては、Google
            の広告に関する案内もあわせてご確認ください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>6. 第三者提供について</h3>
          <p>
            法令に基づく場合などを除き、ご本人の同意なく、取得した情報を目的外で第三者に提供することはありません。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>7. ご確認いただきたいこと</h3>
          <p>
            読み取り結果、分類、集計結果、出力データは、入力前の確認や整理を助けるためのものです。
            申告書の作成や税務判断を代行するものではありません。最終的な内容はご自身で確認のうえ、ご利用ください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>8. お問い合わせ先</h3>
          <p>
            本ポリシーやアプリの利用に関するお問い合わせは、<a href="mailto:toiawase.kt7@gmail.com">toiawase.kt7@gmail.com</a>{" "}
            までご連絡ください。詳しい案内は <Link href="/contact">お問い合わせ</Link> ページにも掲載しています。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>9. 改定について</h3>
          <p>
            本ポリシーは、必要に応じて変更することがあります。変更後の内容は、このページでご案内します。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
