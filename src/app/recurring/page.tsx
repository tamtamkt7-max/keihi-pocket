"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useRecurringTemplates } from "@/hooks/useRecurringTemplates";
import { RecurringTemplateForm } from "@/components/recurring/RecurringTemplateForm";
import { RecurringTemplateList } from "@/components/recurring/RecurringTemplateList";
import { RecurringGenerateButton } from "@/components/recurring/RecurringGenerateButton";

export default function RecurringPage() {
  const { user, profile } = useAuth();
  const { items: categories } = useCategories(user?.uid);
  const { items, refresh } = useRecurringTemplates(user?.uid);

  return (
    <AuthGuard>
      <AppShell>
        <div className="page section">
          <PageHeader
            title="定期支出"
            description="毎月くり返す支払いをまとめて管理できます。"
            actions={
              user && profile ? (
                <RecurringGenerateButton
                  userId={user.uid}
                  templates={items}
                  fiscalYearStartMonth={profile.fiscalYearStartMonth || 1}
                  onDone={refresh}
                />
              ) : null
            }
          />

          {user ? <RecurringTemplateForm userId={user.uid} categories={categories} onSaved={refresh} /> : null}
          <RecurringTemplateList items={items} />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
