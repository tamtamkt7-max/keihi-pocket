export function getFiscalYear(dateString: string, fiscalYearStartMonth: number): number {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= fiscalYearStartMonth ? year : year - 1;
}
