"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { RecordFilterBar } from "@/components/records/RecordFilterBar";
import { RecordList } from "@/components/records/RecordList";
import { RecordSearchBox } from "@/components/records/RecordSearchBox";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useRecords } from "@/hooks/useRecords";

export default function RecordsPage() {
  const { user } = useAuth();
  const { items: categories } = useCategories(user?.uid);
  const { filtered, filters, setFilters, loading, error } = useRecords(user?.uid);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader
            title="一覧"
            description="日付や分類をしぼって、あとから見直せます。"
            actions={
              <div className="wrap">
                <Link href="/records/new?entry=manual">
                  <Button variant="secondary">手入力</Button>
                </Link>
                <Link href="/records/new">
                  <Button>
                    <Camera size={18} />
                    撮る
                  </Button>
                </Link>
              </div>
            }
          />

          <div className="card stack-lg" style={{ padding: 20 }}>
            <RecordSearchBox value={filters.query} onChange={(next) => updateFilter("query", next)} />
            <RecordFilterBar filters={filters} categories={categories} onChange={updateFilter} />
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="heading">
              <h3>表示中の記録</h3>
              <span className="subtitle">{loading ? "読み込み中..." : `${filtered.length}件`}</span>
            </div>
          </div>

          {error ? (
            <div className="card error-card" style={{ padding: 16 }}>
              {error}
            </div>
          ) : null}

          <RecordList items={filtered} />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
