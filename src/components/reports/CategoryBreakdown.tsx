import { Card } from "@/components/ui/Card";
import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryRows } from "@/lib/reports/reportTables";

export function CategoryBreakdown({
  records,
  categories,
}: {
  records: RecordItem[];
  categories: Category[];
}) {
  const totals = getCategoryRows(records, categories);

  return (
    <Card className="list-card">
      <div className="heading"><h3>分類（科目）別</h3></div>
      {totals.length === 0 ? <div className="empty-state">分類を選ぶと、転記前に確認しやすくなります。</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>分類（科目）</th>
              <th>件数</th>
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.count}</td>
                <td className="numeric-cell">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
