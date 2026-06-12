import { RecordItem } from "@/types/record";
import { Category } from "@/types/category";
import { getRecordStatusLabel } from "@/lib/records/recordReview";
import { getCategoryName, getCategoryRows, getMonthlyRows } from "@/lib/reports/reportTables";
import { getUsageTypeLabel } from "@/lib/records/usageType";

function csvEscape(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function paymentMethodLabel(value: string) {
  switch (value) {
    case "cash":
      return "現金";
    case "credit":
      return "カード";
    case "bank":
      return "振込";
    case "e_money":
      return "電子マネー";
    default:
      return "その他";
  }
}

export function exportRecordsCsv(records: RecordItem[], categories: Category[]) {
  const header = [
    "日付",
    "種別",
    "記録の種類",
    "店名・相手先",
    "分類",
    "金額",
    "事業割合",
    "事業用金額",
    "支払方法",
    "メモ",
    "状態",
    "登録日",
    "更新日",
  ];

  const rows = records.map((item) => [
    item.transactionDate,
    item.recordType === "expense" ? "経費" : "売上",
    item.recordType === "expense" ? getUsageTypeLabel(item.usageType) : "",
    item.vendorName,
    getCategoryName(categories, item.categoryId, item.categoryName),
    String(item.amount),
    `${item.businessUsePercent}%`,
    String(item.calculatedBusinessAmount),
    paymentMethodLabel(item.paymentMethod),
    item.memo,
    getRecordStatusLabel(item),
    item.createdAt,
    item.updatedAt,
  ]);

  downloadCsv(`keihi-pocket-records-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
}

export function exportSummaryCsv(records: RecordItem[], categories: Category[]) {
  const categoryRows = getCategoryRows(records, categories).map((item) => [
    "分類（科目）別",
    item.name,
    String(item.count),
    String(item.total),
    "",
    "",
  ]);
  const monthlyRows = getMonthlyRows(records).map((item) => [
    "月別",
    item.month,
    "",
    String(item.income),
    String(item.expense),
    String(item.balance),
  ]);

  downloadCsv(`keihi-pocket-summary-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["区分", "分類・月", "件数", "売上または合計", "経費", "差額"],
    ...categoryRows,
    ...monthlyRows,
  ]);
}
