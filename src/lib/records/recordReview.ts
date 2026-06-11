import { RecordItem } from "@/types/record";

export type ReviewState = "normal" | "needs_review" | "hold" | "organized";

export type RecordReview = {
  state: ReviewState;
  label: string;
  tone: "default" | "primary" | "success" | "warning" | "danger";
  reasons: string[];
};

function hasLowConfidence(item: RecordItem) {
  const extracted = item.ocrExtracted;
  if (!item.ocrRawText || !extracted) return false;
  const values = [extracted.dateConfidence, extracted.amountConfidence, extracted.vendorConfidence].filter(
    (value): value is number => typeof value === "number"
  );
  return values.some((value) => value > 0 && value < 0.35);
}

function hasUsefulCategory(item: RecordItem) {
  const name = (item.categoryName || "").trim();
  if (item.categoryId && name !== "未分類" && name !== "あとで確認") return true;
  return Boolean(name && name !== "未分類" && name !== "あとで確認");
}

export function getRecordReview(item: RecordItem): RecordReview {
  if (item.status === "hold") {
    return { state: "hold", label: "保留", tone: "warning", reasons: ["あとで確認する記録です"] };
  }

  if (item.status === "filed") {
    return { state: "organized", label: "整理済み", tone: "success", reasons: ["アプリ内で確認済みの記録です"] };
  }

  const reasons: string[] = [];
  if (!item.transactionDate) reasons.push("日付なし");
  if (!Number(item.amount)) reasons.push("金額なし");
  if (!hasUsefulCategory(item)) reasons.push("分類なし");
  if (hasLowConfidence(item)) reasons.push("読み取り結果を確認");

  if (reasons.length > 0) {
    return { state: "needs_review", label: "要確認", tone: "danger", reasons };
  }

  return { state: "normal", label: "", tone: "default", reasons: [] };
}

export function getRecordStatusLabel(item: RecordItem) {
  return getRecordReview(item).label || "通常";
}
