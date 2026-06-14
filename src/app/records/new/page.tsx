"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RecordForm } from "@/components/records/RecordForm";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";

function NewRecordContent() {
  const { user, profile } = useAuth();
  const params = useSearchParams();
  const defaultType = useMemo(() => (params.get("type") === "income" ? "income" : "expense"), [params]);
  const initialEntryMode = useMemo(() => {
    const entry = params.get("entry");
    if (entry === "manual" || entry === "upload" || entry === "income") return entry;
    return "camera";
  }, [params]);
  const { items: categories, loading: categoriesLoading } = useCategories(user?.uid);

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader title="登録" description="内容を確認して保存してください。" />

          {user && profile ? (
            <RecordForm
              userId={user.uid}
              fiscalYearStartMonth={profile.fiscalYearStartMonth || 1}
              categories={categories}
              categoriesLoading={categoriesLoading}
              defaultType={defaultType}
              initialEntryMode={initialEntryMode}
            />
          ) : null}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

export default function NewRecordPage() {
  return (
    <Suspense fallback={null}>
      <NewRecordContent />
    </Suspense>
  );
}
