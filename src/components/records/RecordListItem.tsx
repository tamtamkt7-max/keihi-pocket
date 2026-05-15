import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { getRecordReview } from "@/lib/records/recordReview";

export function RecordListItem({ item }: { item: RecordItem }) {
  const status = getRecordReview(item);
  const showStatus = status.state !== "normal";

  return (
    <Link href={`/records/${item.id}`} className="record-row">
      <img className="record-thumb" src={item.thumbnailUrl || "/placeholder.svg"} alt="" />
      <div className="col" style={{ gap: 4 }}>
        <strong>{item.vendorName || "名前なし"}</strong>
        <span className="subtitle">
          {formatDate(item.transactionDate)} ・ {item.recordType === "expense" ? "経費" : "売上"}
        </span>
        {showStatus ? (
          <div className="wrap">
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
        ) : null}
      </div>
      <strong>{formatCurrency(item.amount)}</strong>
    </Link>
  );
}
