import { Card } from "@/components/ui/Card";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getMonthlyRows } from "@/lib/reports/reportTables";

export function MonthlyBreakdown({ records }: { records: RecordItem[] }) {
  const rows = getMonthlyRows(records);

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
            {rows.map((values) => (
              <tr key={values.month}>
                <td>{values.month}</td>
                <td className="numeric-cell">{formatCurrency(values.income)}</td>
                <td className="numeric-cell">{formatCurrency(values.expense)}</td>
                <td className="numeric-cell">{formatCurrency(values.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
