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
  { name: "接待交際費", type: "expense", sortOrder: 280, isDefault: true, isActive: true, description: "取引先との飲食、贈答など" },
  { name: "会議費", type: "expense", sortOrder: 290, isDefault: true, isActive: true, description: "打ち合わせ時の飲食など" },
  { name: "修繕費", type: "expense", sortOrder: 300, isDefault: true, isActive: true, description: "修理、部品交換など" },
  { name: "荷造運賃", type: "expense", sortOrder: 310, isDefault: true, isActive: true, description: "送料、梱包材など" },
  { name: "支払手数料", type: "expense", sortOrder: 320, isDefault: true, isActive: true, description: "振込手数料、決済手数料など" },
  { name: "租税公課", type: "expense", sortOrder: 330, isDefault: true, isActive: true, description: "印紙、事業に関係する税金など" },
  { name: "保険料", type: "expense", sortOrder: 340, isDefault: true, isActive: true, description: "事業用の保険など" },
  { name: "新聞図書費", type: "expense", sortOrder: 350, isDefault: true, isActive: true, description: "本、資料、購読料など" },
  { name: "研修費", type: "expense", sortOrder: 360, isDefault: true, isActive: true, description: "講座、セミナーなど" },
  { name: "教育費", type: "expense", sortOrder: 370, isDefault: true, isActive: true, description: "学習、教材、講習など" },
  { name: "雑費", type: "expense", sortOrder: 380, isDefault: true, isActive: true, description: "他に当てはまらない少額の支出" },
  { name: "その他経費", type: "expense", sortOrder: 390, isDefault: true, isActive: true, description: "上に当てはまらない経費" },

  { name: "飲食費", type: "expense", sortOrder: 410, isDefault: true, isActive: true, description: "事業に関係する飲食" },
  { name: "食費", type: "expense", sortOrder: 420, isDefault: true, isActive: true, description: "生活費としての飲食" },
  { name: "カフェ", type: "expense", sortOrder: 430, isDefault: true, isActive: true, description: "カフェ、作業場所の飲食など" },
  { name: "コンビニ", type: "expense", sortOrder: 440, isDefault: true, isActive: true, description: "コンビニでの購入" },
  { name: "スーパー", type: "expense", sortOrder: 450, isDefault: true, isActive: true, description: "スーパーでの購入" },
  { name: "ドラッグストア", type: "expense", sortOrder: 460, isDefault: true, isActive: true, description: "日用品、薬など" },
  { name: "ホームセンター", type: "expense", sortOrder: 470, isDefault: true, isActive: true, description: "工具、備品、資材など" },
  { name: "ガソリン代", type: "expense", sortOrder: 480, isDefault: true, isActive: true, description: "車の燃料代など" },
  { name: "駐車場代", type: "expense", sortOrder: 490, isDefault: true, isActive: true, description: "駐車料金など" },
  { name: "タクシー", type: "expense", sortOrder: 500, isDefault: true, isActive: true, description: "タクシー代など" },
  { name: "電車・バス", type: "expense", sortOrder: 510, isDefault: true, isActive: true, description: "電車、バス、交通系ICなど" },
  { name: "宿泊費", type: "expense", sortOrder: 520, isDefault: true, isActive: true, description: "ホテル、宿泊など" },
  { name: "郵送・配送料", type: "expense", sortOrder: 530, isDefault: true, isActive: true, description: "郵便、宅配、配送など" },
  { name: "クリーニング", type: "expense", sortOrder: 540, isDefault: true, isActive: true, description: "クリーニング代など" },
  { name: "美容・身だしなみ", type: "expense", sortOrder: 550, isDefault: true, isActive: true, description: "身だしなみ関連の支出" },
  { name: "医療・薬", type: "expense", sortOrder: 560, isDefault: true, isActive: true, description: "薬、通院、医療関連など" },
  { name: "家電・備品", type: "expense", sortOrder: 570, isDefault: true, isActive: true, description: "家電、仕事用の備品など" },
  { name: "家具・インテリア", type: "expense", sortOrder: 580, isDefault: true, isActive: true, description: "机、椅子、収納など" },
  { name: "衣服", type: "expense", sortOrder: 590, isDefault: true, isActive: true, description: "服、作業着など" },
  { name: "書籍", type: "expense", sortOrder: 600, isDefault: true, isActive: true, description: "本、資料、電子書籍など" },
  { name: "サブスク", type: "expense", sortOrder: 610, isDefault: true, isActive: true, description: "月額サービス" },
  { name: "ソフトウェア", type: "expense", sortOrder: 620, isDefault: true, isActive: true, description: "アプリ、ツール、ソフト利用料" },
  { name: "クラウドサービス", type: "expense", sortOrder: 630, isDefault: true, isActive: true, description: "オンラインサービス利用料など" },
  { name: "レンタル・リース", type: "expense", sortOrder: 640, isDefault: true, isActive: true, description: "機材、車、設備の利用料など" },
  { name: "交際・贈答", type: "expense", sortOrder: 650, isDefault: true, isActive: true, description: "贈り物、手土産など" },
  { name: "子ども関連", type: "expense", sortOrder: 660, isDefault: true, isActive: true, description: "子どもに関する支出" },
  { name: "家族・生活", type: "expense", sortOrder: 670, isDefault: true, isActive: true, description: "生活まわりの支出" },

  { name: "給料賃金", type: "expense", sortOrder: 710, isDefault: true, isActive: true, description: "従業員への給与など" },
  { name: "利子割引料", type: "expense", sortOrder: 720, isDefault: true, isActive: true, description: "借入金の利息など" },
  { name: "減価償却費", type: "expense", sortOrder: 730, isDefault: true, isActive: true, description: "高額な備品などの整理用" },
  { name: "貸倒金", type: "expense", sortOrder: 740, isDefault: true, isActive: true, description: "回収できない売掛金など" },
  { name: "専従者給与", type: "expense", sortOrder: 750, isDefault: true, isActive: true, description: "家族従業員への給与など" },
  { name: "福利厚生費", type: "expense", sortOrder: 760, isDefault: true, isActive: true, description: "従業員向けの支出など" },
  { name: "貸倒引当金", type: "expense", sortOrder: 770, isDefault: true, isActive: true, description: "申告前に確認する項目" },
  { name: "青色申告特別控除対象外メモ", type: "expense", sortOrder: 780, isDefault: true, isActive: true, description: "申告前に確認するメモ" },
  { name: "その他申告用", type: "expense", sortOrder: 790, isDefault: true, isActive: true, description: "申告前に整理したい項目" },

  { name: "未分類", type: "common", sortOrder: 910, isDefault: true, isActive: true, description: "一時的に置いておく分類" },
  { name: "あとで確認", type: "common", sortOrder: 920, isDefault: true, isActive: true, description: "分類に迷うもの" },
  { name: "その他", type: "common", sortOrder: 930, isDefault: true, isActive: true, description: "迷ったときの一時置き場" },
];

export function getDefaultCategoryDescription(name: string) {
  return defaultCategories.find((item) => item.name === name)?.description || "";
}
