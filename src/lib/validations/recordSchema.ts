import { z } from "zod";

export const recordSchema = z.object({
  recordType: z.enum(["expense", "income"]),
  documentType: z.enum(["receipt", "invoice", "statement", "delivery_note", "other"]),
  transactionDate: z.string().min(1, "日付を入れてください"),
  amount: z.coerce.number().min(1, "金額を入れてください"),
  vendorName: z.string().min(1, "お店・相手先を入れてください"),
  categoryId: z.string().nullable(),
  categoryName: z.string().optional(),
  tagIds: z.array(z.string()),
  paymentMethod: z.enum(["cash", "credit", "bank", "e_money", "other"]),
  usageType: z.enum(["spending", "business_expense"]).optional(),
  businessUsePercent: z.coerce.number().min(0).max(100),
  taxType: z.enum(["inclusive", "exclusive", "none"]),
  taxRate: z.coerce.number().nullable(),
  taxAmount: z.coerce.number().nullable(),
  invoiceNumberMemo: z.string(),
  memo: z.string(),
  status: z.enum(["unconfirmed", "confirmed", "filed", "hold"]),
  recurringTemplateId: z.string().nullable(),
  imageUrls: z.array(z.string()).default([]),
  thumbnailUrl: z.string().nullable(),
  ocrRawText: z.string().default(""),
  ocrExtracted: z.object({
    date: z.string().optional(),
    amount: z.number().optional(),
    vendorName: z.string().optional(),
    dateConfidence: z.number().optional(),
    amountConfidence: z.number().optional(),
    vendorConfidence: z.number().optional(),
    dateCandidates: z.array(z.string()).optional(),
    amountCandidates: z.array(z.union([
      z.number(),
      z.object({
        value: z.number(),
        sourceLine: z.string(),
        nearbyLabel: z.string(),
        score: z.number(),
        reason: z.string(),
        excludedReason: z.string().optional(),
        selectedReason: z.string().optional(),
      }),
    ])).optional(),
    vendorNameCandidates: z.array(z.string()).optional(),
    provider: z.enum(["vision", "fallback"]).optional(),
    debug: z.object({
      accepted: z.array(z.object({
        field: z.enum(["date", "amount", "vendorName"]),
        value: z.string(),
        confidence: z.number(),
        reason: z.string(),
      })),
      rejected: z.array(z.object({
        field: z.enum(["date", "amount", "vendorName"]),
        value: z.string(),
        confidence: z.number(),
        reason: z.string(),
      })),
    }).optional(),
  }).optional(),
});

export type RecordFormValues = z.infer<typeof recordSchema>;
