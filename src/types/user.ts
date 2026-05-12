export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  businessName: string;
  fiscalYearStartMonth: number;
  defaultBusinessUsePercent: number;
  defaultTaxType: "inclusive" | "exclusive" | "none";
  createdAt: string;
  updatedAt: string;
}
