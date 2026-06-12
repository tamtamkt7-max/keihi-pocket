import { UsageType } from "@/types/record";

export function getUsageTypeLabel(value?: UsageType | string | null) {
  return value === "business_expense" ? "経費" : "支出";
}
