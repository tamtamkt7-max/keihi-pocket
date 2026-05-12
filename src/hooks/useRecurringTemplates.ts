"use client";

import { useEffect, useState } from "react";
import { getRecurringTemplates } from "@/lib/firestore/recurringTemplates";
import { RecurringTemplate } from "@/types/recurring";

export function useRecurringTemplates(userId?: string) {
  const [items, setItems] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!userId) return;
    setLoading(true);
    const next = await getRecurringTemplates(userId);
    setItems(next);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  return { items, loading, refresh };
}
