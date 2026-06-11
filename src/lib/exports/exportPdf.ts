import jsPDF from "jspdf";
import { RecordItem } from "@/types/record";
import { Category } from "@/types/category";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getReportSummary } from "@/lib/calculations/reportSummary";
import { getRecordStatusLabel } from "@/lib/records/recordReview";
import { getCategoryName, getCategoryRows, getMonthlyRows, getReportPeriod, getReviewRows } from "@/lib/reports/reportTables";

let fontReady: Promise<string> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function loadJapaneseFont(pdf: jsPDF) {
  if (!fontReady) {
    fontReady = fetch("/fonts/NotoSansJP-Regular.ttf")
      .then((response) => response.arrayBuffer())
      .then(arrayBufferToBase64);
  }
  const font = await fontReady;
  pdf.addFileToVFS("NotoSansJP-Regular.ttf", font);
  pdf.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
  pdf.setFont("NotoSansJP", "normal");
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function addText(pdf: jsPDF, text: string, x: number, y: number, options?: { align?: "left" | "right" | "center"; size?: number }) {
  if (options?.size) pdf.setFontSize(options.size);
  pdf.text(text, x, y, { align: options?.align || "left" });
}

function ensurePage(pdf: jsPDF, y: number) {
  if (y <= 280) return y;
  pdf.addPage();
  return 18;
}

function tableHeader(pdf: jsPDF, labels: Array<{ text: string; x: number; align?: "left" | "right" }>, y: number) {
  pdf.setFontSize(9);
  labels.forEach((item) => addText(pdf, item.text, item.x, y, { align: item.align }));
  pdf.line(14, y + 2, 196, y + 2);
  return y + 8;
}

export async function exportRecordsPdf(records: RecordItem[], categories: Category[]) {
  const pdf = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(pdf);
  const summary = getReportSummary(records);
  const categoryRows = getCategoryRows(records, categories);
  const monthlyRows = getMonthlyRows(records);
  const reviewRows = getReviewRows(records, categories);
  const today = new Date().toISOString().slice(0, 10);

  pdf.setFontSize(16);
  addText(pdf, "経費ポケット 集計メモ", 14, 16);
  pdf.setFontSize(10);
  addText(pdf, `対象期間: ${getReportPeriod(records)}`, 14, 26);
  addText(pdf, `作成日: ${today}`, 14, 33);
  addText(pdf, "このPDFは申告書ではありません。e-Taxや申告書へ入力する前に内容を確認してください。", 14, 43);
  addText(pdf, "税務判断は、必要に応じて税理士・税務署等に確認してください。", 14, 50);

  let y = 64;
  pdf.setFontSize(12);
  addText(pdf, "概要", 14, y);
  y += 8;
  const overview = [
    ["売上合計", formatCurrency(summary.incomeTotal)],
    ["経費合計", formatCurrency(summary.expenseTotal)],
    ["差額", formatCurrency(summary.balance)],
    ["記録件数", `${summary.count}件`],
    ["要確認", `${summary.needsReviewCount}件`],
  ];
  pdf.setFontSize(10);
  overview.forEach(([label, value]) => {
    addText(pdf, label, 18, y);
    addText(pdf, value, 82, y, { align: "right" });
    y += 7;
  });

  y += 8;
  addText(pdf, "分類（科目）別集計", 14, y, { size: 12 });
  y = tableHeader(pdf, [
    { text: "分類", x: 18 },
    { text: "件数", x: 136, align: "right" },
    { text: "合計", x: 190, align: "right" },
  ], y + 8);
  categoryRows.forEach((row) => {
    y = ensurePage(pdf, y);
    addText(pdf, truncate(row.name, 24), 18, y);
    addText(pdf, `${row.count}`, 136, y, { align: "right" });
    addText(pdf, formatCurrency(row.total), 190, y, { align: "right" });
    y += 7;
  });

  y += 8;
  y = ensurePage(pdf, y);
  addText(pdf, "月別集計", 14, y, { size: 12 });
  y = tableHeader(pdf, [
    { text: "月", x: 18 },
    { text: "売上", x: 82, align: "right" },
    { text: "経費", x: 136, align: "right" },
    { text: "差額", x: 190, align: "right" },
  ], y + 8);
  monthlyRows.forEach((row) => {
    y = ensurePage(pdf, y);
    addText(pdf, row.month, 18, y);
    addText(pdf, formatCurrency(row.income), 82, y, { align: "right" });
    addText(pdf, formatCurrency(row.expense), 136, y, { align: "right" });
    addText(pdf, formatCurrency(row.balance), 190, y, { align: "right" });
    y += 7;
  });

  y += 8;
  y = ensurePage(pdf, y);
  addText(pdf, "要確認リスト", 14, y, { size: 12 });
  if (reviewRows.length === 0) {
    y += 8;
    addText(pdf, "要確認の記録はありません。", 18, y);
  } else {
    y = tableHeader(pdf, [
      { text: "日付", x: 18 },
      { text: "相手先", x: 48 },
      { text: "分類", x: 108 },
      { text: "理由", x: 150 },
    ], y + 8);
    reviewRows.slice(0, 30).forEach(({ record, review, categoryName }) => {
      y = ensurePage(pdf, y);
      addText(pdf, record.transactionDate || "日付なし", 18, y);
      addText(pdf, truncate(record.vendorName || "名前なし", 14), 48, y);
      addText(pdf, truncate(categoryName, 10), 108, y);
      addText(pdf, truncate(review.reasons.join("、"), 16), 150, y);
      y += 7;
    });
  }

  pdf.addPage();
  y = 18;
  addText(pdf, "明細一覧", 14, y, { size: 12 });
  y = tableHeader(pdf, [
    { text: "日付", x: 14 },
    { text: "種別", x: 42 },
    { text: "店名・相手先", x: 62 },
    { text: "分類", x: 112 },
    { text: "金額", x: 166, align: "right" },
    { text: "状態", x: 190, align: "right" },
  ], y + 8);
  records.forEach((item) => {
    y = ensurePage(pdf, y);
    addText(pdf, item.transactionDate || "-", 14, y);
    addText(pdf, item.recordType === "expense" ? "経費" : "売上", 42, y);
    addText(pdf, truncate(item.vendorName || "名前なし", 14), 62, y);
    addText(pdf, truncate(getCategoryName(categories, item.categoryId, item.categoryName), 12), 112, y);
    addText(pdf, formatCurrency(item.amount), 166, y, { align: "right" });
    addText(pdf, getRecordStatusLabel(item), 190, y, { align: "right" });
    if (item.memo) {
      y += 5;
      addText(pdf, `メモ: ${truncate(item.memo, 42)}`, 62, y);
    }
    y += 7;
  });

  pdf.save(`keihi-pocket-summary-${today}.pdf`);
}
