import { z } from "zod";

export const recurringSchema = z.object({
  name: z.string().min(1, "名称を入れてください"),
  recordType: z.enum(["expense", "income"]),
  amount: z.coerce.number().min(1),
  vendorName: z.string().min(1),
  categoryId: z.string().nullable(),
  paymentMethod: z.enum(["cash", "credit", "bank", "e_money", "other"]),
  businessUsePercent: z.coerce.number().min(0).max(100),
  taxType: z.enum(["inclusive", "exclusive", "none"]),
  taxRate: z.coerce.number().nullable(),
  memo: z.string(),
  dayOfMonth: z.coerce.number().min(1).max(31),
  isAutoCreate: z.boolean(),
  isActive: z.boolean(),
});
