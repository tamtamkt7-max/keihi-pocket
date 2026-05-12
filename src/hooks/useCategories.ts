"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types/category";
import { ensureDefaultCategories, getCategories } from "@/lib/firestore/categories";

export function useCategories(userId?: string) {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!userId) return;
    setLoading(true);
    const next = await ensureDefaultCategories(userId);
    setItems(next);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  return { items, loading, refresh };
}
