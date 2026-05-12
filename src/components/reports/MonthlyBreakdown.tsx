import { Card } from "@/components/ui/Card";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function MonthlyBreakdown({ records }: { records: RecordItem[] }) {
  const map = new Map<string, { expense: number; income: number }>();

  for (const record of records) {
    const current = map.get(record.transactionYearMonthKey) || { expense: 0, income: 0 };
    if (record.recordType === "expense") current.expense += record.calculatedBusinessAmount;
    if (record.recordType === "income") current.income += record.amount;
    map.set(record.transactionYearMonthKey, current);
  }

  const rows = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <Card className="list-card">
      <div className="heading"><h3>月別推移</h3></div>
      {rows.length === 0 ? <div className="empty-state">記録を保存すると、月ごとの数字がここに並びます。</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>年月</th>
              <th>売上</th>
              <th>経費</th>
              <th>差額</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([month, values]) => (
              <tr key={month}>
                <td>{month}</td>
                <td>{formatCurrency(values.income)}</td>
                <td>{formatCurrency(values.expense)}</td>
                <td>{formatCurrency(values.income - values.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
