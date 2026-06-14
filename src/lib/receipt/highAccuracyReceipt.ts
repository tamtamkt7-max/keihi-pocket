export type HighAccuracyReceiptItem = {
  name: string;
  quantity: string | null;
  unitPrice: number | null;
  amount: number | null;
};

export type HighAccuracyReceiptResult = {
  date: string | null;
  time: string | null;
  amount: number | null;
  vendor: string | null;
  address: string | null;
  phone: string | null;
  paymentMethod: string | null;
  categorySuggestion: string | null;
  items: HighAccuracyReceiptItem[];
  confidence: {
    date: number;
    amount: number;
    vendor: number;
  };
  warnings: string[];
};

export type HighAccuracyReceiptResponse = {
  available: boolean;
  result?: HighAccuracyReceiptResult;
  message?: string;
  reason?: "daily_limit";
  rewardAdAvailable?: boolean;
  rewardBonusReads?: number;
  rewardAdWatchedCount?: number;
  rewardAdDailyLimit?: number;
};

export function isUsefulCategoryName(value?: string | null) {
  const name = (value || "").trim();
  return Boolean(name && name !== "未分類" && name !== "あとで確認");
}
