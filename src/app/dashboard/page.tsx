"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
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
import { AdSlot } from "@/components/ads/AdSlot";
import { RecordItem } from "@/types/record";

export default function DashboardPage() {
  const { user, isDemoMode } = useAuth();
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
            description="売上、経費、残りをまとめて確認できます。"
            actions={
              <Link href="/records/new" className="button primary header-camera-button">
                <Camera size={18} />
                撮る
              </Link>
            }
          />

          {isDemoMode ? (
            <Card className="list-card">
              <div className="heading" style={{ alignItems: "center" }}>
                <div>
                  <h3>ログインすると、スマホやPCでも見られます。</h3>
                  <p className="subtitle" style={{ marginBottom: 0 }}>
                    今の記録はこの端末だけに保存されています。
                  </p>
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
            <div className="segmented-control" role="tablist" aria-label="表示期間">
              <button type="button" className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>
                月
              </button>
              <button type="button" className={period === "year" ? "active" : ""} onClick={() => setPeriod("year")}>
                年
              </button>
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
          />

          <RecentRecords items={recent} />

          <AdSlot placement="home-bottom" />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
