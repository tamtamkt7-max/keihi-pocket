"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { CategoryBreakdown } from "@/components/reports/CategoryBreakdown";
import { MonthlyBreakdown } from "@/components/reports/MonthlyBreakdown";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useRecords } from "@/hooks/useRecords";
import { getReportSummary } from "@/lib/calculations/reportSummary";
import { exportRecordsCsv } from "@/lib/exports/exportCsv";
import { exportRecordsPdf } from "@/lib/exports/exportPdf";
import { AdSlot } from "@/components/ads/AdSlot";

export default function ReportsPage() {
  const { user } = useAuth();
  const { filtered, error } = useRecords(user?.uid);
  const { items: categories } = useCategories(user?.uid);
  const summary = getReportSummary(filtered);

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader
            title="集計"
            description="月ごと、年ごとの数字をまとめて見られます。"
            actions={
              <div className="wrap">
                <Button variant="secondary" onClick={() => exportRecordsCsv(filtered)}>
                  CSVで保存
                </Button>
                <Button variant="secondary" onClick={() => exportRecordsPdf(filtered)}>
                  PDFで保存
                </Button>
              </div>
            }
          />

          <ReportSummary
            expenseTotal={summary.expenseTotal}
            incomeTotal={summary.incomeTotal}
            balance={summary.balance}
            unconfirmedCount={summary.unconfirmedCount}
            uncategorizedCount={summary.uncategorizedCount}
          />

          {error ? (
            <div className="card error-card" style={{ padding: 16 }}>
              {error}
            </div>
          ) : null}

          <div className="support-panel">
            <strong>見直したいところ</strong>
            <span>分類がまだの記録があるときは、先に整えておくと集計が見やすくなります。</span>
          </div>

          <MonthlyBreakdown records={filtered} />
          <CategoryBreakdown records={filtered} categories={categories} />

          <AdSlot placement="reports-bottom" />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
