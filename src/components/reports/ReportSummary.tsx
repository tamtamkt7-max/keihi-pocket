import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function ReportSummary({
  expenseTotal,
  incomeTotal,
  balance,
  uncategorizedCount,
  needsReviewCount,
  holdCount,
}: {
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
  unconfirmedCount: number;
  uncategorizedCount: number;
  needsReviewCount?: number;
  holdCount?: number;
}) {
  return (
    <div className="grid-3 report-summary-grid">
      <Card className="metric-card">
        <div className="metric-label">経費</div>
        <div className="metric-value">{formatCurrency(expenseTotal)}</div>
      </Card>
      <Card className="metric-card">
        <div className="metric-label">売上</div>
        <div className="metric-value">{formatCurrency(incomeTotal)}</div>
      </Card>
      <Card className="metric-card">
        <div className="metric-label">差額</div>
        <div className="metric-value">{formatCurrency(balance)}</div>
      </Card>
      <Card className="metric-card">
        <div className="metric-label">要確認</div>
        <div className="metric-value">{needsReviewCount ?? uncategorizedCount}</div>
      </Card>
      <Card className="metric-card">
        <div className="metric-label">未分類</div>
        <div className="metric-value">{uncategorizedCount}</div>
      </Card>
      <Card className="metric-card">
        <div className="metric-label">保留</div>
        <div className="metric-value">{holdCount ?? 0}</div>
      </Card>
    </div>
  );
}
