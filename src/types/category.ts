export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "expense" | "income" | "common";
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
}
