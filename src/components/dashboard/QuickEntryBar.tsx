"use client";

import React, { useRef, useState } from "react";
import { saveRecord } from "@/lib/firestore/records";
import { RecordItem } from "@/types/record";

interface QuickEntryBarProps {
  userId: string;
  onSuccess: (optimisticRecord: RecordItem, realRecordPromise: Promise<string>) => void;
}

export function QuickEntryBar({ userId, onSuccess }: QuickEntryBarProps) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanAmount = parseInt(amount.replace(/[^\d]/g, ""), 10);
    if (!cleanAmount || cleanAmount <= 0) return;

    setIsSubmitting(true);

    const tempId = "optimistic_" + Date.now();
    const txDate = new Date().toISOString().slice(0, 10);

    const newRecord: RecordItem = {
      id: tempId,
      userId,
      recordType: "expense",
      documentType: "receipt",
      transactionDate: txDate,
      amount: cleanAmount,
      vendorName: "",
      categoryId: null,
      categoryName: "未分類",
      tagIds: [],
      paymentMethod: "cash",
      usageType: "spending",
      businessUsePercent: 100,
      calculatedBusinessAmount: cleanAmount,
      taxType: "inclusive",
      taxRate: 10,
      taxAmount: null,
      invoiceNumberMemo: "",
      memo: memo.trim(),
      status: "unconfirmed",
      imageUrls: [],
      thumbnailUrl: null,
      ocrRawText: "",
      ocrExtracted: {},
      recurringTemplateId: null,
      fiscalYear: new Date().getFullYear(),
      transactionMonth: String(new Date().getMonth() + 1),
      transactionYearMonthKey: txDate.slice(0, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Firebaseへの保存プロミスを作成
    const savePromise = saveRecord({
      userId,
      amount: cleanAmount,
      memo: memo.trim(),
      recordType: "expense",
      status: "unconfirmed",
    });

    // 楽観的UI更新を親コンポーネントへ伝える
    onSuccess(newRecord, savePromise);

    // 入力値を即時クリアして次の入力の準備をする
    setAmount("");
    setMemo("");
    setIsSubmitting(false);

    // 金額入力欄にフォーカスを戻す
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 50);
  }

  return (
    <div className="quick-entry-bar">
      <form onSubmit={handleSubmit} className="quick-entry-form">
        <input
          ref={amountInputRef}
          type="tel"
          pattern="[0-9]*"
          className="quick-entry-input amount"
          placeholder="金額 (¥)"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          required
          disabled={isSubmitting}
          aria-label="クイック金額入力"
        />
        <input
          type="text"
          className="quick-entry-input memo"
          placeholder="メモ（品目、店名など）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={isSubmitting}
          aria-label="クイックメモ入力"
        />
        <button type="submit" className="quick-entry-submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中" : "登録"}
        </button>
      </form>
    </div>
  );
}
