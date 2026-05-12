import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "お問い合わせ",
};

export default function ContactPage() {
  return (
    <AppShell>
      <div className="page section legal-page">
        <PageHeader title="お問い合わせ" description="ご不明な点があるときはこちらをご確認ください。" />

        <Card className="list-card legal-section">
          <h3>お問い合わせ先</h3>
          <p>
            公開前のため、お問い合わせ窓口は準備中です。公開時にはこのページでご案内します。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>ご連絡いただきたい内容</h3>
          <ul className="legal-list">
            <li>お使いの端末やブラウザ</li>
            <li>起きた内容</li>
            <li>再現しやすい手順</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
