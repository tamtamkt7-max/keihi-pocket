export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p>当サイト（経費ポケット）は、ユーザーの個人情報を適切に取り扱い、保護することに努めます。</p>
      
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. 取得する情報</h2>
        <p>当サイトでは、Googleアカウントによるログイン情報、およびアップロードされたレシート画像データを取得します。これらのデータは、経費の自動読み取りおよびユーザーのデータ管理の目的のみに使用されます。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. 広告の配信について</h2>
        <p>当サイトは、Google AdSenseなどの第三者配信の広告サービスを利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. データの保存と削除</h2>
        <p>アップロードされた画像やデータは、ユーザー自身でいつでも削除・変更が可能です。当サイトは、ユーザーの許可なく第三者にデータを提供することはありません。</p>
      </section>
    </div>
  );
}