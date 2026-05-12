import { Card } from "@/components/ui/Card";
import { RecurringTemplate } from "@/types/recurring";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function RecurringTemplateList({ items }: { items: RecurringTemplate[] }) {
  return (
    <Card className="list-card">
      <div className="heading">
        <h3>登録中の定期支出</h3>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          まだ登録がありません。毎月くり返す支払いがあれば追加しておくと便利です。
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>名前</th>
              <th>相手先</th>
              <th>金額</th>
              <th>日付</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.vendorName}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{item.dayOfMonth}日</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
