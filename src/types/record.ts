export type RecordType = "expense" | "income";
export type DocumentType = "receipt" | "invoice" | "statement" | "delivery_note" | "other";
export type RecordStatus = "unconfirmed" | "confirmed" | "filed" | "hold";
export type PaymentMethod = "cash" | "credit" | "bank" | "e_money" | "other";
export type TaxType = "inclusive" | "exclusive" | "none";

export interface AmountCandidate {
  value: number;
  sourceLine: string;
  nearbyLabel: string;
  score: number;
  reason: string;
  excludedReason?: string;
  selectedReason?: string;
}

export interface OcrExtracted {
  date?: string;
  amount?: number;
  vendorName?: string;
  dateConfidence?: number;
  amountConfidence?: number;
  vendorConfidence?: number;
  dateCandidates?: string[];
  amountCandidates?: AmountCandidate[];
  vendorNameCandidates?: string[];
  provider?: "vision" | "fallback";
  debug?: {
    accepted: Array<{ field: "date" | "amount" | "vendorName"; value: string; confidence: number; reason: string }>;
    rejected: Array<{ field: "date" | "amount" | "vendorName"; value: string; confidence: number; reason: string }>;
  };
}

export interface RecordItem {
  id: string;
  userId: string;
  recordType: RecordType;
  documentType: DocumentType;
  transactionDate: string;
  amount: number;
  vendorName: string;
  categoryId: string | null;
  tagIds: string[];
  paymentMethod: PaymentMethod;
  businessUsePercent: number;
  calculatedBusinessAmount: number;
  taxType: TaxType;
  taxRate: number | null;
  taxAmount: number | null;
  invoiceNumberMemo: string;
  memo: string;
  status: RecordStatus;
  imageUrls: string[];
  thumbnailUrl: string | null;
  ocrRawText: string;
  ocrExtracted?: OcrExtracted;
  recurringTemplateId: string | null;
  fiscalYear: number;
  transactionMonth: string;
  transactionYearMonthKey: string;
  createdAt: string;
  updatedAt: string;
}
