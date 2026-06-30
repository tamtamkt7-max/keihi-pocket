"use client";

import { useMemo } from "react";
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
  const { items, filtered, filters, setFilters, error } = useRecords(user?.uid);
  const { items: categories } = useCategories(user?.uid);
  const summary = getReportSummary(filtered);

  const years = useMemo(() => {
    const list = items.map((item) => item.fiscalYear).filter((y): y is number => typeof y === "number");
    const current = new Date().getFullYear();
    list.push(current);
    return Array.from(new Set(list)).sort((a, b) => b - a);
  }, [items]);

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

          <div className="card list-card" style={{ padding: "16px 20px", marginBottom: 8 }}>
            <div className="row" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div className="field" style={{ margin: 0, display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <label htmlFor="report-year" style={{ margin: 0, whiteSpace: "nowrap", fontWeight: 700 }}>集計対象年:</label>
                <select
                  id="report-year"
                  className="select"
                  style={{ width: "auto", minHeight: 38, padding: "4px 12px", border: "1px solid var(--line)" }}
                  value={filters.year}
                  onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
                >
                  <option value="">全期間</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}年分
                    </option>
                  ))}
                </select>
              </div>
              <span className="subtitle" style={{ fontSize: 13 }}>
                ※ 確定申告の対象期間に絞って、集計データやCSV・PDFを出力できます。
              </span>
            </div>
          </div>

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
