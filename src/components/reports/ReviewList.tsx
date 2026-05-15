import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getReviewRows } from "@/lib/reports/reportTables";

export function ReviewList({ records, categories }: { records: RecordItem[]; categories: Category[] }) {
  const rows = getReviewRows(records, categories);

  return (
    <Card className="list-card">
      <div className="heading">
        <h3>要確認リスト</h3>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">要確認の記録はありません。</div>
      ) : (
        rows.slice(0, 12).map(({ record, review, categoryName }) => (
          <Link href={`/records/${record.id}/edit`} key={record.id} className="record-row">
            <div className="record-thumb" aria-hidden="true" />
            <div className="col" style={{ gap: 4 }}>
              <strong>{record.vendorName || "名前なし"}</strong>
              <span className="subtitle">
                {record.transactionDate || "日付なし"} ・ {categoryName}
              </span>
              <div className="wrap">
                <Badge tone={review.tone}>{review.label}</Badge>
                {review.reasons.map((reason) => (
                  <span key={reason} className="subtitle">{reason}</span>
                ))}
              </div>
            </div>
            <strong>{formatCurrency(record.amount)}</strong>
          </Link>
        ))
      )}
    </Card>
  );
}
