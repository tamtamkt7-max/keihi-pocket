"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { CategoryBreakdown } from "@/components/reports/CategoryBreakdown";
import { MonthlyBreakdown } from "@/components/reports/MonthlyBreakdown";
import { ReviewList } from "@/components/reports/ReviewList";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useRecords } from "@/hooks/useRecords";
import { getReportSummary } from "@/lib/calculations/reportSummary";
import { exportRecordsCsv, exportSummaryCsv } from "@/lib/exports/exportCsv";
import { exportRecordsPdf } from "@/lib/exports/exportPdf";
import { getReportPeriod } from "@/lib/reports/reportTables";

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
            description="申告前に、e-Taxへ入力する数字を確認しやすく整理します。"
            actions={
              <div className="wrap">
                <Button variant="secondary" onClick={() => exportRecordsCsv(filtered, categories)}>
                  CSV出力
                </Button>
                <Button variant="secondary" onClick={() => exportSummaryCsv(filtered, categories)}>
                  集計CSV
                </Button>
                <Button variant="secondary" onClick={() => exportRecordsPdf(filtered, categories)}>
                  PDF出力
                </Button>
              </div>
            }
          />

          <div className="support-panel">
            <strong>対象期間</strong>
            <span>{getReportPeriod(filtered)}</span>
          </div>

          <ReportSummary
            expenseTotal={summary.expenseTotal}
            incomeTotal={summary.incomeTotal}
            balance={summary.balance}
            unconfirmedCount={summary.unconfirmedCount}
            uncategorizedCount={summary.uncategorizedCount}
            needsReviewCount={summary.needsReviewCount}
            holdCount={summary.holdCount}
          />

          {error ? (
            <div className="card error-card" style={{ padding: 16 }}>
              {error}
            </div>
          ) : null}

          <div className="support-panel">
            <strong>申告前の確認</strong>
            <span>この画面は入力前の整理用です。分類や金額は必要に応じて確認してください。</span>
          </div>

          <MonthlyBreakdown records={filtered} />
          <CategoryBreakdown records={filtered} categories={categories} />
          <ReviewList records={filtered} categories={categories} />

        </div>
      </AppShell>
    </AuthGuard>
  );
}
