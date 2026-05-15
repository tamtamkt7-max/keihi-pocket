import { Card } from "@/components/ui/Card";

export function StatusCards({
  uncategorizedCount,
  holdCount,
  needsReviewCount,
  count,
}: {
  unconfirmedCount: number;
  uncategorizedCount: number;
  needsReviewCount?: number;
  holdCount: number;
  count: number;
}) {
  const items = [
    { label: "記録数", value: count, hint: "今月" },
    { label: "要確認", value: needsReviewCount ?? uncategorizedCount, hint: (needsReviewCount ?? uncategorizedCount) ? "確認" : "OK" },
    { label: "未分類", value: uncategorizedCount, hint: uncategorizedCount ? "分類なし" : "OK" },
    { label: "保留", value: holdCount, hint: holdCount ? "確認" : "OK" },
  ];

  return (
    <div className="grid-3 dashboard-grid">
      {items.map((item) => (
        <Card key={item.label} className="metric-card metric-card-compact">
          <div className="metric-label">{item.label}</div>
          <div className="metric-mini-value">{item.value}</div>
          <div className="subtitle">{item.hint}</div>
        </Card>
      ))}
    </div>
  );
}
