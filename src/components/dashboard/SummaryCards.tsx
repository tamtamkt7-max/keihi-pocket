import { ArrowDownCircle, ArrowUpCircle, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function SummaryCards({
  incomeTotal,
  expenseTotal,
  balance,
  periodLabel,
}: {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  periodLabel: string;
}) {
  const items = [
    { label: "売上", value: incomeTotal, icon: ArrowUpCircle, tone: "income" },
    { label: "経費", value: expenseTotal, icon: ArrowDownCircle, tone: "expense" },
    { label: "差額", value: balance, icon: WalletCards, tone: balance >= 0 ? "balance" : "expense" },
  ];

  return (
    <div className="grid-3 dashboard-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className={`metric-card dashboard-metric ${item.tone}`}>
            <div className="metric-top">
              <span className="metric-label">{periodLabel}の{item.label}</span>
              <Icon size={20} />
            </div>
            <div className="metric-value">{formatCurrency(item.value)}</div>
          </Card>
        );
      })}
    </div>
  );
}
