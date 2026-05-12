export function generateYearMonthKey(dateString: string): {
  transactionMonth: string;
  transactionYearMonthKey: string;
  year: number;
  month: number;
} {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return {
    transactionMonth: month,
    transactionYearMonthKey: `${year}-${month}`,
    year,
    month: Number(month),
  };
}
