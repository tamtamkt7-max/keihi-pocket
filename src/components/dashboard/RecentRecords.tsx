import Link from "next/link";
import { Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

function getVisibleStatus(status: string) {
  if (status === "hold") {
    return { label: "保留", tone: "warning" as const };
  }

  return null;
}

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
          <Link href="/records/new" className="button primary">
            <Camera size={18} />
            まずは撮る
          </Link>
        </div>
      ) : (
        items.map((item) => {
          const status = getVisibleStatus(item.status);
          return (
            <Link href={`/records/${item.id}`} key={item.id} className="record-row">
              <img className="record-thumb" src={item.thumbnailUrl || "/placeholder.svg"} alt="" />
              <div className="col" style={{ gap: 4 }}>
                <strong>{item.vendorName || "お店・相手先を追加"}</strong>
                <span className="subtitle">
                  {formatDate(item.transactionDate)} ・ {item.recordType === "expense" ? "経費" : "売上"}
                </span>
                {status ? (
                  <div className="wrap">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                ) : null}
              </div>
              <strong className={item.recordType === "income" ? "amount-income" : ""}>{formatCurrency(item.amount)}</strong>
            </Link>
          );
        })
      )}
    </Card>
  );
}
