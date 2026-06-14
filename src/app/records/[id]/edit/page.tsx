"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RecordForm } from "@/components/records/RecordForm";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { getRecordById } from "@/lib/firestore/records";
import { RecordItem } from "@/types/record";

export default function EditRecordPage() {
  const params = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { items: categories, loading: categoriesLoading } = useCategories(user?.uid);
  const [item, setItem] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id || !user?.uid) return;
    (async () => {
      setLoading(true);
      const next = await getRecordById(params.id, user.uid);
      setItem(next);
      setLoading(false);
    })();
  }, [params?.id, user?.uid]);

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader title="編集" description="内容をご確認ください。" />
          {loading ? <div className="card" style={{ padding: 24 }}>内容を開いています...</div> : null}
          {!loading && user && profile && item ? (
            <RecordForm
              userId={user.uid}
              fiscalYearStartMonth={profile.fiscalYearStartMonth || 1}
              categories={categories}
              categoriesLoading={categoriesLoading}
              initial={item}
              defaultType={item.recordType}
            />
          ) : null}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
