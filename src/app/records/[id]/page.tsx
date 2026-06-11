"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { RecordDetail } from "@/components/records/RecordDetail";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { deleteRecord, getRecordById } from "@/lib/firestore/records";
import { RecordItem } from "@/types/record";

export default function RecordDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { items: categories } = useCategories(user?.uid);
  const [item, setItem] = useState<RecordItem | null>(null);

  useEffect(() => {
    if (!params?.id || !user?.uid) return;
    (async () => {
      const next = await getRecordById(params.id, user.uid);
      setItem(next);
    })();
  }, [params?.id, user?.uid]);

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader
            title="記録の詳細"
            description="保存した内容を見返せます。"
            actions={
              <div className="wrap">
                {item ? (
                  <Link href={`/records/${item.id}/edit`}>
                    <Button variant="secondary">編集する</Button>
                  </Link>
                ) : null}
                <Link href="/records/new">
                  <Button variant="secondary">新しく登録</Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!item) return;
                    const ok = window.confirm("この記録を削除しますか？");
                    if (!ok) return;
                    await deleteRecord(item.id, user?.uid);
                    router.push("/records");
                  }}
                >
                  削除
                </Button>
              </div>
            }
          />

          {item ? <RecordDetail item={item} categories={categories} /> : <div className="card" style={{ padding: 24 }}>内容を開いています...</div>}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
