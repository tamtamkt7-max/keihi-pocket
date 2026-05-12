import { RecordItem } from "@/types/record";

export function getReportSummary(records: RecordItem[]) {
  const expenseTotal = records
    .filter((item) => item.recordType === "expense")
    .reduce((sum, item) => sum + item.calculatedBusinessAmount, 0);

  const incomeTotal = records
    .filter((item) => item.recordType === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const statusCounts = records.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const uncategorizedCount = records.filter((item) => !item.categoryId).length;

  return {
    expenseTotal,
    incomeTotal,
    balance: incomeTotal - expenseTotal,
    uncategorizedCount,
    unconfirmedCount: statusCounts.unconfirmed || 0,
    holdCount: statusCounts.hold || 0,
    count: records.length,
  };
}
