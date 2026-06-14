import { UsageType } from "@/types/record";

export function getUsageTypeLabel(value?: UsageType | string | null) {
  return value === "business_expense" ? "事業用の支払い" : "個人の支払い";
}
