import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { getRecordReview } from "@/lib/records/recordReview";

export function getCategoryName(categories: Category[], categoryId: string | null) {
  if (!categoryId) return "未分類";
  return categories.find((item) => item.id === categoryId)?.name || "未分類";
}

export function getReportPeriod(records: RecordItem[]) {
  const dates = records.map((item) => item.transactionDate).filter(Boolean).sort();
  if (dates.length === 0) return "対象記録なし";
  const first = dates[0].slice(0, 7).replace("-", "年") + "月";
  const last = dates[dates.length - 1].slice(0, 7).replace("-", "年") + "月";
  return first === last ? first : `${first}〜${last}`;
}

export function getCategoryRows(records: RecordItem[], categories: Category[]) {
  const map = new Map<string, { name: string; count: number; total: number }>();

  for (const record of records) {
    const name = getCategoryName(categories, record.categoryId);
    const current = map.get(name) || { name, count: 0, total: 0 };
    current.count += 1;
    current.total += record.recordType === "income" ? record.amount : record.calculatedBusinessAmount;
    map.set(name, current);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function getMonthlyRows(records: RecordItem[]) {
  const map = new Map<string, { month: string; income: number; expense: number; balance: number }>();

  for (const record of records) {
    const month = record.transactionYearMonthKey || (record.transactionDate ? record.transactionDate.slice(0, 7) : "日付なし");
    const current = map.get(month) || { month, income: 0, expense: 0, balance: 0 };
    if (record.recordType === "income") current.income += record.amount;
    if (record.recordType === "expense") current.expense += record.calculatedBusinessAmount;
    current.balance = current.income - current.expense;
    map.set(month, current);
  }

  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export function getReviewRows(records: RecordItem[], categories: Category[]) {
  return records
    .map((record) => ({ record, review: getRecordReview(record), categoryName: getCategoryName(categories, record.categoryId) }))
    .filter((item) => item.review.state === "needs_review" || item.review.state === "hold");
}
