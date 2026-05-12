export interface RecurringTemplate {
  id: string;
  userId: string;
  name: string;
  recordType: "expense" | "income";
  amount: number;
  vendorName: string;
  categoryId: string | null;
  paymentMethod: "cash" | "credit" | "bank" | "e_money" | "other";
  businessUsePercent: number;
  taxType: "inclusive" | "exclusive" | "none";
  taxRate: number | null;
  memo: string;
  dayOfMonth: number;
  isAutoCreate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
