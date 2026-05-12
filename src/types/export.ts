export interface ExportHistory {
  id: string;
  userId: string;
  exportType: "csv" | "pdf";
  filterSummary: string;
  createdAt: string;
}
