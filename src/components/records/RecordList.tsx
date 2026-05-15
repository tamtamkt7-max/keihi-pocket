import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Camera } from "lucide-react";
import { RecordItem } from "@/types/record";
import { RecordListItem } from "./RecordListItem";

export function RecordList({ items }: { items: RecordItem[] }) {
  return (
    <Card className="list-card">
      {items.length === 0 ? (
        <div className="empty-state rich-empty-state">
          <p>まだ記録がありません。</p>
          <Link href="/records/new" className="button primary">
            <Camera size={18} />
            登録する
          </Link>
        </div>
      ) : (
        items.map((item) => <RecordListItem key={item.id} item={item} />)
      )}
    </Card>
  );
}
