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
        <PageHeader title="お問い合わせ" description="困ったときや確認したいことがあるときはこちら。" />

        <Card className="list-card legal-section">
          <h3>お問い合わせ先</h3>
          <p>
            経費ポケットに関するお問い合わせは、次のメールアドレスまでご連絡ください。
          </p>
          <p>
            <a href="mailto:toiawase.kt7@gmail.com">toiawase.kt7@gmail.com</a>
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>ご連絡いただきたい内容</h3>
          <ul className="legal-list">
            <li>利用端末（例: iPhone、Android、PC）</li>
            <li>発生した画面（例: 登録、一覧、集計、ログイン）</li>
            <li>何をしようとしたか</li>
            <li>表示された文言があれば、その内容</li>
          </ul>
        </Card>

        <Card className="list-card legal-section">
          <h3>返信について</h3>
          <p>
            内容を確認して返信します。個人で運営しているため、返信までお時間をいただく場合があります。
            すぐに解決できない内容については、確認後にあらためてご連絡します。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>お願い</h3>
          <p>
            レシート画像や個人情報を送る場合は、必要な範囲にとどめてください。金額や日付など、状況が分かる内容だけでも
            確認できる場合があります。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
