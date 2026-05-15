"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { saveCategory } from "@/lib/firestore/categories";
import { getDefaultCategoryDescription } from "@/lib/categories/defaultCategories";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { items, refresh } = useCategories(user?.uid);
  const [name, setName] = useState("");

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader title="分類" description="申告前に見返しやすいよう、よく使う分類を用意しています。" />

          <Card className="list-card">
            <div className="row">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="新しい分類名" />
              <Button
                onClick={async () => {
                  if (!user || !name.trim()) return;
                  await saveCategory({
                    id: `cat_${Date.now()}`,
                    userId: user.uid,
                    name: name.trim(),
                    type: "common",
                    sortOrder: items.length + 100,
                    isDefault: false,
                    isActive: true,
                  });
                  setName("");
                  await refresh();
                }}
              >
                追加
              </Button>
            </div>
          </Card>

          <Card className="list-card">
            {items.length === 0 ? (
              <div className="empty-state">
                まだ分類がありません。よく使う名前を追加しておくと、登録するときに選びやすくなります。
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>種類</th>
                    <th>目安</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.type === "expense" ? "経費" : item.type === "income" ? "売上" : "共通"}</td>
                      <td>{item.description || getDefaultCategoryDescription(item.name) || "必要に応じて選んでください"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
