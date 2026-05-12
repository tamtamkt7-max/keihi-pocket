import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function ReportSummary({
  expenseTotal,
  incomeTotal,
  balance,
  uncategorizedCount,
}: {
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
  unconfirmedCount: number;
  uncategorizedCount: number;
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
        <div className="metric-label">未分類</div>
        <div className="metric-value">{uncategorizedCount}</div>
      </Card>
    </div>
  );
}
