"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RecordDetail } from "@/components/records/RecordDetail";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { deleteRecord, getRecordById } from "@/lib/firestore/records";
import { RecordItem } from "@/types/record";

export default function RecordDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const savedMode = searchParams.get("saved");

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader
            title="記録の詳細"
            description="内容を確認したり、あとから直したりできます。"
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

          {savedMode === "details-only" ? (
            <Card className="list-card soft-warning-card">
              <div>
                <strong>内容を保存しました</strong>
                <p className="subtitle" style={{ margin: "6px 0 0" }}>
                  画像は保存されませんでしたが、日付や金額などの内容は残っています。
                </p>
              </div>
            </Card>
          ) : null}

          {item ? <RecordDetail item={item} categories={categories} /> : <div className="card" style={{ padding: 24 }}>読み込み中...</div>}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
