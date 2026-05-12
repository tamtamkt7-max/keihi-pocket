import { Card } from "@/components/ui/Card";
import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function CategoryBreakdown({
  records,
  categories,
}: {
  records: RecordItem[];
  categories: Category[];
}) {
  const totals = categories.map((category) => ({
    id: category.id,
    name: category.name,
    amount: records
      .filter((record) => record.categoryId === category.id)
      .reduce((sum, record) => sum + record.calculatedBusinessAmount, 0),
  })).filter((item) => item.amount > 0);

  return (
    <Card className="list-card">
      <div className="heading"><h3>分類別</h3></div>
      {totals.length === 0 ? <div className="empty-state">分類を選ぶと、使い道ごとの合計が見られます。</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>分類</th>
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
