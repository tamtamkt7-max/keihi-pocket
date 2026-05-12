import { Card } from "@/components/ui/Card";

export function StatusCards({
  uncategorizedCount,
  holdCount,
  count,
}: {
  unconfirmedCount: number;
  uncategorizedCount: number;
  holdCount: number;
  count: number;
}) {
  const items = [
    { label: "記録数", value: count, hint: "今月" },
    { label: "未分類", value: uncategorizedCount, hint: uncategorizedCount ? "見直し" : "OK" },
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
