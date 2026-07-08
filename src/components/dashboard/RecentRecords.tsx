import Link from "next/link";
import { Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { getRecordReview } from "@/lib/records/recordReview";

export function RecentRecords({ items }: { items: RecordItem[] }) {
  return (
    <Card className="list-card">
      <div className="heading">
        <h3>最近の記録</h3>
        <Link href="/records" className="subtitle">
          一覧を見る
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="empty-state rich-empty-state">
          <p>まだ記録がありません。</p>
          <Link href="/records/new?entry=choose" className="button primary">
            <Camera size={18} />
            登録する
          </Link>
        </div>
      ) : (
        items.map((item) => {
          const status = getRecordReview(item);
          const showStatus = status.state !== "normal";
          return (
            <Link href={`/records/${item.id}`} key={item.id} className="record-row">
              <img className="record-thumb" src={item.thumbnailUrl || "/placeholder.svg"} alt="" />
              <div className="col" style={{ gap: 4 }}>
                <strong>{item.vendorName || "名前なし"}</strong>
                <span className="subtitle">
                  {formatDate(item.transactionDate)} ・ {item.recordType === "expense" ? "経費" : "売上"}
                </span>
                <div className="wrap" style={{ gap: 6 }}>
                  {showStatus && <Badge tone={status.tone}>{status.label}</Badge>}
                  {!item.thumbnailUrl && (
                    <Badge tone="warning" style={{ fontSize: 10, padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      📸 画像を追加
                    </Badge>
                  )}
                </div>
              </div>
              <strong className={item.recordType === "income" ? "amount-income" : ""}>{formatCurrency(item.amount)}</strong>
            </Link>
          );
        })
      )}
    </Card>
  );
}
