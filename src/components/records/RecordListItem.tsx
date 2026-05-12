import Link from "next/link";
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

export function RecordListItem({ item }: { item: RecordItem }) {
  const status = getVisibleStatus(item.status);

  return (
    <Link href={`/records/${item.id}`} className="record-row">
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
      <strong>{formatCurrency(item.amount)}</strong>
    </Link>
  );
}
