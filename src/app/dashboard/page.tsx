"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { getRecords, getRecentRecords } from "@/lib/firestore/records";
import { getReportSummary } from "@/lib/calculations/reportSummary";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { RecentRecords } from "@/components/dashboard/RecentRecords";
import { FirstRunGuide } from "@/components/dashboard/FirstRunGuide";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReceiptCaptureButton } from "@/components/records/ReceiptCaptureButton";
import { RecordItem } from "@/types/record";
import { QuickEntryBar } from "@/components/dashboard/QuickEntryBar";
import { useCategories } from "@/hooks/useCategories";
import { exportRecordsCsv } from "@/lib/exports/exportCsv";

export default function DashboardPage() {
  const { user, isDemoMode } = useAuth();
  const { items: categories } = useCategories(user?.uid);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recent, setRecent] = useState<RecordItem[]>([]);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setError("");
      try {
        const [all, latest] = await Promise.all([getRecords(user.uid), getRecentRecords(user.uid)]);
        setRecords(all);
        setRecent(latest);
      } catch (loadError) {
        console.error("dashboard records load failed", loadError);
        setError("記録を読み込めませんでした。通信状況を確認して、もう一度お試しください。");
      }
    })();
  }, [user]);

  function handleQuickEntrySuccess(optimisticRecord: RecordItem, realRecordPromise: Promise<string>) {
    // 楽観的UI更新
    setRecords((prev) => [optimisticRecord, ...prev]);
    setRecent((prev) => [optimisticRecord, ...prev].slice(0, 5));

    realRecordPromise
      .then(async () => {
        if (!user) return;
        // 最新データを再取得して正しく再マッピング
        const [all, latest] = await Promise.all([getRecords(user.uid), getRecentRecords(user.uid)]);
        setRecords(all);
        setRecent(latest);
      })
      .catch((err) => {
        console.error("Quick entry save failed:", err);
        // 失敗したらロールバック
        setRecords((prev) => prev.filter((r) => r.id !== optimisticRecord.id));
        setRecent((prev) => prev.filter((r) => r.id !== optimisticRecord.id));
        alert("登録に失敗しました。通信環境をご確認ください。");
      });
  }

  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const currentYear = now.getFullYear();

  const targetRecords = useMemo(() => {
    if (period === "year") {
      return records.filter((item) => item.fiscalYear === currentYear);
    }
    return records.filter((item) => item.transactionYearMonthKey === currentMonthKey);
  }, [records, period, currentMonthKey, currentYear]);

  const summary = getReportSummary(targetRecords);
  const periodLabel = period === "month" ? "今月" : "今年";

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader
            title="経費ポケット"
            description="レシートを撮って、経費と売上をまとめて管理。"
            actions={
              <ReceiptCaptureButton className="button primary header-camera-button" compact>
                撮る
              </ReceiptCaptureButton>
            }
          />

          <Card className="list-card home-intro-card">
            <div className="home-intro-copy">
              <span className="badge primary">はじめてでもかんたん</span>
              <h2>写真で登録して、あとから見返せます。</h2>
              <p className="subtitle">
                レシートを撮るか写真を選んで、内容を確認して保存できます。一覧や集計にもすぐ反映されます。
              </p>
            </div>
            <div className="home-intro-actions">
              <Link href="/records/new?entry=choose" className="button primary">
                登録する
              </Link>
              <Link href="/reports" className="button secondary">
                集計を見る
              </Link>
            </div>
          </Card>

          {isDemoMode ? (
            <Card className="list-card">
              <div className="heading" style={{ alignItems: "center" }}>
                <div>
                  <h3>まずはこのまま試せます。</h3>
                  <p className="subtitle" style={{ marginBottom: 0 }}>お試し中の記録は、この端末だけに保存されます。</p>
                </div>
                <Link href="/login?next=/dashboard">
                  <Button variant="secondary">ログインして保存</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          <FirstRunGuide />

          <section className="dashboard-hero">
            <div>
              <span className="badge primary">{periodLabel}</span>
              <h2>{period === "month" ? "今月のまとめ" : "今年のまとめ"}</h2>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {user && (
                <Button
                  variant="secondary"
                  onClick={() => exportRecordsCsv(targetRecords, categories)}
                  style={{ minHeight: 36, padding: "0 12px", fontSize: 12, fontWeight: 700 }}
                >
                  CSV出力
                </Button>
              )}
              <div className="segmented-control" role="tablist" aria-label="表示期間">
                <button type="button" className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>
                  月
                </button>
                <button type="button" className={period === "year" ? "active" : ""} onClick={() => setPeriod("year")}>
                  年
                </button>
              </div>
            </div>
          </section>

          <SummaryCards
            incomeTotal={summary.incomeTotal}
            expenseTotal={summary.expenseTotal}
            balance={summary.balance}
            periodLabel={periodLabel}
          />

          {error ? (
            <Card className="list-card error-card">
              <div>{error}</div>
            </Card>
          ) : null}

          <StatusCards
            count={summary.count}
            holdCount={summary.holdCount}
            unconfirmedCount={summary.unconfirmedCount}
            uncategorizedCount={summary.uncategorizedCount}
            needsReviewCount={summary.needsReviewCount}
          />

          <RecentRecords items={recent} />

        </div>
        {user && <QuickEntryBar userId={user.uid} onSuccess={handleQuickEntrySuccess} />}
      </AppShell>
    </AuthGuard>
  );
}
