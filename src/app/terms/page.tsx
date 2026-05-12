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
        <PageHeader title="利用規約" description="ご利用前にご確認ください。" />

        <Card className="list-card legal-section">
          <h3>1. このアプリについて</h3>
          <p>
            経費ポケットは、レシートや売上の記録を整理しやすくするための補助アプリです。
            税務判断や申告内容そのものを保証するものではありません。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>2. 入力内容の確認</h3>
          <p>
            読み取った内容や手入力した内容は、利用者ご自身で確認してください。
            保存前後を問わず、最終的な確認は利用者の責任で行うものとします。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>3. 利用できる範囲</h3>
          <p>
            現時点では、外部の会計サービスとの自動連携や e-Tax への直接送信は行いません。
            記録と整理を助ける目的でご利用ください。
          </p>
        </Card>

        <Card className="list-card legal-section">
          <h3>4. サービスの変更</h3>
          <p>
            サービス内容や画面、保存方法は、改善のために変更されることがあります。
            大きな変更がある場合は、アプリ内または関連ページでお知らせします。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
