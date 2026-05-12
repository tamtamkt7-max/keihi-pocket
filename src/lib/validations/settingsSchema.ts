import { z } from "zod";

export const settingsSchema = z.object({
  businessName: z.string().min(1, "事業名または屋号を入力してください"),
  fiscalYearStartMonth: z.coerce.number().min(1).max(12),
  defaultBusinessUsePercent: z.coerce.number().min(0).max(100),
  defaultTaxType: z.enum(["inclusive", "exclusive", "none"]),
});
