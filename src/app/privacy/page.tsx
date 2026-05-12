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
        <PageHeader title="プライバシーポリシー" description="取り扱う情報についてご案内します。" />

        <Card className="list-card legal-section">
          <h3>1. 保存する情報</h3>
          <p>
            経費ポケットでは、日付、金額、店名や相手先、分類、メモなど、記録に必要な情報を保存します。
            ログインして使う場合は、ログインに使ったメールアドレスなどの情報も扱います。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>2. レシート画像について</h3>
          <p>
            レシート画像は現時点で必須保存ではありません。内容の保存を優先しており、設定や利用状況によっては画像を保存しない場合があります。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>3. 読み取り処理について</h3>
          <p>
            レシートの内容を読み取るために、Google Cloud Vision API を利用する場合があります。読み取り精度を上げるための処理であり、必ずしもすべての項目が正確に入るわけではありません。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>4. お問い合わせ</h3>
          <p>
            このページの内容やアプリの使い方については、<Link href="/contact">お問い合わせ</Link> からご確認ください。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
