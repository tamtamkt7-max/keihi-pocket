import jsPDF from "jspdf";
import { RecordItem } from "@/types/record";

export function exportRecordsPdf(records: RecordItem[]) {
  const pdf = new jsPDF();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);
  pdf.text("Keihi Pocket Report", 14, 16);
  pdf.setFontSize(10);

  let y = 28;
  records.slice(0, 40).forEach((item, index) => {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(
      `${index + 1}. ${item.transactionDate} | ${item.recordType} | ${item.vendorName} | ${item.amount}円`,
      14,
      y
    );
    y += 8;
  });

  pdf.save(`keihi-pocket-${new Date().toISOString().slice(0, 10)}.pdf`);
}
