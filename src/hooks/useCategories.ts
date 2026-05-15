"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types/category";
import { ensureDefaultCategories } from "@/lib/firestore/categories";

export function useCategories(userId?: string) {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    if (!userId) {
      setItems([]);
      setLoadedUserId(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    console.info("ensure default categories started", { userId });
    try {
      const next = await ensureDefaultCategories(userId);
      console.info("ensure default categories completed", { userId, count: next.length });
      console.info("categories after ensure count", next.length);
      setItems(next);
      setLoadedUserId(userId);
    } catch (refreshError) {
      console.error("categories load failed", refreshError);
      setError("分類を読み込めませんでした。");
      setItems([]);
      setLoadedUserId(userId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  const preparing = Boolean(userId) && (loading || loadedUserId !== userId);

  return { items, loading: preparing, error, refresh };
}
