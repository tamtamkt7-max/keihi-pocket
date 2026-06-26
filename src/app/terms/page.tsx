export default function TermsOfService() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p>この利用規約は、当サイト（経費ポケット）の利用条件を定めるものです。</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. サービスの目的</h2>
        <p>当サイトは、レシート情報の読み取りと経費データの整理を補助するツールです。確定申告等の税務に関する最終的な判断は、ユーザー自身の責任において行ってください。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. 禁止事項</h2>
        <p>ユーザーは、当サイトの利用にあたり、以下の行為をしてはなりません。<br />- 法令または公序良俗に違反する行為<br />- 当サイトのサーバーやネットワークの機能を破壊したり、妨害したりする行為</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. 免責事項</h2>
        <p>当サイトのAIによる読み取り結果は100%の精度を保証するものではありません。当サイトの利用により生じた損害について、運営者は一切の責任を負いません。</p>
      </section>
    </div>
  );
}