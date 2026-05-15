import { Category } from "@/types/category";

export type DefaultCategory = Pick<Category, "name" | "type" | "sortOrder" | "isDefault" | "isActive"> & {
  description: string;
};

export const defaultCategories: DefaultCategory[] = [
  { name: "売上", type: "income", sortOrder: 0, isDefault: true, isActive: true, description: "入金、販売、報酬など" },
  { name: "仕入", type: "expense", sortOrder: 10, isDefault: true, isActive: true, description: "販売する商品の購入など" },
  { name: "消耗品費", type: "expense", sortOrder: 20, isDefault: true, isActive: true, description: "文具、少額の備品など" },
  { name: "通信費", type: "expense", sortOrder: 30, isDefault: true, isActive: true, description: "スマホ代、ネット代など" },
  { name: "旅費交通費", type: "expense", sortOrder: 40, isDefault: true, isActive: true, description: "電車、バス、駐車場など" },
  { name: "水道光熱費", type: "expense", sortOrder: 50, isDefault: true, isActive: true, description: "電気、ガス、水道など" },
  { name: "地代家賃", type: "expense", sortOrder: 60, isDefault: true, isActive: true, description: "事務所、店舗、作業場など" },
  { name: "広告宣伝費", type: "expense", sortOrder: 70, isDefault: true, isActive: true, description: "広告、チラシ、掲載料など" },
  { name: "接待交際費", type: "expense", sortOrder: 80, isDefault: true, isActive: true, description: "打ち合わせの飲食など" },
  { name: "修繕費", type: "expense", sortOrder: 90, isDefault: true, isActive: true, description: "修理、部品交換など" },
  { name: "荷造運賃", type: "expense", sortOrder: 100, isDefault: true, isActive: true, description: "送料、梱包材など" },
  { name: "支払手数料", type: "expense", sortOrder: 110, isDefault: true, isActive: true, description: "振込手数料、決済手数料など" },
  { name: "租税公課", type: "expense", sortOrder: 120, isDefault: true, isActive: true, description: "印紙、事業に関係する税金など" },
  { name: "保険料", type: "expense", sortOrder: 130, isDefault: true, isActive: true, description: "事業用の保険など" },
  { name: "外注費", type: "expense", sortOrder: 140, isDefault: true, isActive: true, description: "外部への依頼、制作費など" },
  { name: "新聞図書費", type: "expense", sortOrder: 150, isDefault: true, isActive: true, description: "本、資料、購読料など" },
  { name: "雑費", type: "expense", sortOrder: 160, isDefault: true, isActive: true, description: "少額で他に分けにくい支出" },
  { name: "その他", type: "common", sortOrder: 900, isDefault: true, isActive: true, description: "迷ったときの一時置き場" },
];

export function getDefaultCategoryDescription(name: string) {
  return defaultCategories.find((item) => item.name === name)?.description || "";
}
