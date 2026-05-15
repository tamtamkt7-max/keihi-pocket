import { Category } from "@/types/category";

export type DefaultCategory = Pick<Category, "name" | "type" | "sortOrder" | "isDefault" | "isActive"> & {
  description: string;
};

export const defaultCategories: DefaultCategory[] = [
  { name: "売上", type: "income", sortOrder: 10, isDefault: true, isActive: true, description: "販売、報酬、サービス代など" },
  { name: "雑収入", type: "income", sortOrder: 20, isDefault: true, isActive: true, description: "本業以外の入金など" },
  { name: "返金・入金", type: "income", sortOrder: 30, isDefault: true, isActive: true, description: "返金、立替の戻りなど" },
  { name: "その他収入", type: "income", sortOrder: 40, isDefault: true, isActive: true, description: "上に当てはまらない入金" },

  { name: "仕入", type: "expense", sortOrder: 110, isDefault: true, isActive: true, description: "販売する商品の購入など" },
  { name: "材料費", type: "expense", sortOrder: 120, isDefault: true, isActive: true, description: "制作や製造に使う材料など" },
  { name: "商品代", type: "expense", sortOrder: 130, isDefault: true, isActive: true, description: "販売用の商品購入など" },
  { name: "原価", type: "expense", sortOrder: 140, isDefault: true, isActive: true, description: "売上に直接関係する費用など" },
  { name: "外注費", type: "expense", sortOrder: 150, isDefault: true, isActive: true, description: "外部への依頼、制作費など" },

  { name: "消耗品費", type: "expense", sortOrder: 210, isDefault: true, isActive: true, description: "文具、少額の備品など" },
  { name: "事務用品費", type: "expense", sortOrder: 220, isDefault: true, isActive: true, description: "ノート、封筒、事務用品など" },
  { name: "通信費", type: "expense", sortOrder: 230, isDefault: true, isActive: true, description: "スマホ代、ネット代など" },
  { name: "旅費交通費", type: "expense", sortOrder: 240, isDefault: true, isActive: true, description: "電車、バス、駐車場など" },
  { name: "水道光熱費", type: "expense", sortOrder: 250, isDefault: true, isActive: true, description: "電気、ガス、水道など" },
  { name: "地代家賃", type: "expense", sortOrder: 260, isDefault: true, isActive: true, description: "事務所、店舗、作業場など" },
  { name: "広告宣伝費", type: "expense", sortOrder: 270, isDefault: true, isActive: true, description: "広告、チラシ、掲載料など" },
  { name: "接待交際費", type: "expense", sortOrder: 280, isDefault: true, isActive: true, description: "取引先との飲食・贈答など" },
  { name: "会議費", type: "expense", sortOrder: 290, isDefault: true, isActive: true, description: "打ち合わせ時の飲み物・軽食など" },
  { name: "福利厚生費", type: "expense", sortOrder: 300, isDefault: true, isActive: true, description: "従業員向けの支出など" },
  { name: "修繕費", type: "expense", sortOrder: 310, isDefault: true, isActive: true, description: "修理、部品交換など" },
  { name: "荷造運賃", type: "expense", sortOrder: 320, isDefault: true, isActive: true, description: "送料、梱包材など" },
  { name: "支払手数料", type: "expense", sortOrder: 330, isDefault: true, isActive: true, description: "振込手数料、決済手数料など" },
  { name: "租税公課", type: "expense", sortOrder: 340, isDefault: true, isActive: true, description: "印紙、事業に関係する税金など" },
  { name: "保険料", type: "expense", sortOrder: 350, isDefault: true, isActive: true, description: "事業用の保険など" },
  { name: "新聞図書費", type: "expense", sortOrder: 360, isDefault: true, isActive: true, description: "本、資料、購読料など" },
  { name: "研修費", type: "expense", sortOrder: 370, isDefault: true, isActive: true, description: "講座、セミナーなど" },
  { name: "減価償却費", type: "expense", sortOrder: 380, isDefault: true, isActive: true, description: "高額な備品などの整理用" },
  { name: "給料賃金", type: "expense", sortOrder: 390, isDefault: true, isActive: true, description: "従業員への給与など" },
  { name: "専従者給与", type: "expense", sortOrder: 400, isDefault: true, isActive: true, description: "家族従業員への給与など" },
  { name: "利子割引料", type: "expense", sortOrder: 410, isDefault: true, isActive: true, description: "借入金の利息など" },
  { name: "雑費", type: "expense", sortOrder: 420, isDefault: true, isActive: true, description: "他に当てはまらない少額の支出" },
  { name: "その他経費", type: "expense", sortOrder: 430, isDefault: true, isActive: true, description: "上に当てはまらない経費" },

  { name: "あとで確認", type: "common", sortOrder: 910, isDefault: true, isActive: true, description: "分類に迷うもの" },
  { name: "未分類", type: "common", sortOrder: 920, isDefault: true, isActive: true, description: "まだ分類していない記録" },
];

export function getDefaultCategoryDescription(name: string) {
  return defaultCategories.find((item) => item.name === name)?.description || "";
}
