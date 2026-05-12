import { RecordItem } from "@/types/record";

function csvEscape(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function exportRecordsCsv(records: RecordItem[]) {
  const header = [
    "取引日",
    "売上経費",
    "取引先",
    "金額",
    "計上額",
    "ステータス",
    "メモ",
  ];

  const rows = records.map((item) => [
    item.transactionDate,
    item.recordType === "expense" ? "経費" : "売上",
    item.vendorName,
    String(item.amount),
    String(item.calculatedBusinessAmount),
    item.status,
    item.memo,
  ]);

  const content = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `keihi-pocket-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
