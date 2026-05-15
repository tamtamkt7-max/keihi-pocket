"use client";

import { useEffect, useMemo, useState } from "react";
import { getRecords } from "@/lib/firestore/records";
import { RecordItem } from "@/types/record";
import { getRecordReview } from "@/lib/records/recordReview";

interface FilterState {
  query: string;
  month: string;
  recordType: string;
  status: string;
  categoryId: string;
}

export function useRecords(userId?: string) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    month: "",
    recordType: "",
    status: "",
    categoryId: "",
  });

  async function refresh() {
    if (!userId) {
      setItems([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const next = await getRecords(userId);
      setItems(next);
    } catch (refreshError) {
      console.error("records refresh failed", refreshError);
      setError("記録を読み込めませんでした。通信状況を確認して、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const query = filters.query.trim().toLowerCase();
      if (query && !`${item.vendorName} ${item.memo}`.toLowerCase().includes(query)) return false;
      if (filters.month && item.transactionYearMonthKey !== filters.month) return false;
      if (filters.recordType && item.recordType !== filters.recordType) return false;
      if (filters.status === "needs_review" && getRecordReview(item).state !== "needs_review") return false;
      if (filters.status && filters.status !== "needs_review" && item.status !== filters.status) return false;
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      return true;
    });
  }, [items, filters]);

  return { items, filtered, loading, error, filters, setFilters, refresh };
}
