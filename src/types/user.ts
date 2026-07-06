export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  plan?: "free" | "plus";
  plusUntil?: string | null;
  subscriptionStatus?: "inactive" | "active" | "past_due" | "canceled";
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  businessName: string;
  fiscalYearStartMonth: number;
  defaultBusinessUsePercent: number;
  defaultTaxType: "inclusive" | "exclusive" | "none";
  createdAt: string;
  updatedAt: string;
}
