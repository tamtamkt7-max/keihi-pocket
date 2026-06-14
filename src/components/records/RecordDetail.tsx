import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { Badge } from "@/components/ui/Badge";
import { getRecordReview } from "@/lib/records/recordReview";
import { getUsageTypeLabel } from "@/lib/records/usageType";

export function RecordDetail({
  item,
  categories,
}: {
  item: RecordItem;
  categories: Category[];
}) {
  const category = categories.find((cat) => cat.id === item.categoryId);
  const review = getRecordReview(item);

  return (
    <div className="section">
      {item.thumbnailUrl ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <img src={item.thumbnailUrl} alt="登録した画像" style={{ width: "100%", maxHeight: 420, objectFit: "cover" }} />
        </div>
      ) : null}

      <div className="card" style={{ padding: 16 }}>
        <div className="heading">
          <h3>登録内容</h3>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>日付</label>
            <div>{formatDate(item.transactionDate)}</div>
          </div>
          <div className="field">
            <label>金額</label>
            <div>{formatCurrency(item.amount)}</div>
          </div>
          <div className="field">
            <label>{item.recordType === "income" ? "入金元" : "お店・相手先"}</label>
            <div>{item.vendorName || "-"}</div>
          </div>
          <div className="field">
            <label>分類</label>
            <div>{category?.name || item.categoryName || "未分類"}</div>
          </div>
          <div className="field">
            <label>種類</label>
            <div>{item.recordType === "expense" ? "経費" : "売上"}</div>
          </div>
          {item.recordType === "expense" ? (
            <div className="field">
              <label>記録の用途</label>
              <div>{getUsageTypeLabel(item.usageType)}</div>
            </div>
          ) : null}
          {review.state !== "normal" ? (
            <div className="field">
              <label>状態</label>
              <div className="wrap">
                <Badge tone={review.tone}>{review.label}</Badge>
                {review.reasons.map((reason) => (
                  <span key={reason} className="subtitle">{reason}</span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="field">
            <label>事業で使う割合</label>
            <div>{item.businessUsePercent}%</div>
          </div>
          <div className="field">
            <label>事業に含める金額</label>
            <div>{formatCurrency(item.calculatedBusinessAmount)}</div>
          </div>
        </div>
        {item.memo ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label>メモ</label>
            <div>{item.memo}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
