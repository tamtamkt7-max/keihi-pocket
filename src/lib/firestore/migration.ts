import { getDemoRecords, getDemoCategories, getDemoVendorSuggestions, getDemoRecurringTemplates, DEMO_USER_ID } from "@/lib/mock/localDb";
import { saveRecord } from "@/lib/firestore/records";
import { saveCategory, ensureDefaultCategories } from "@/lib/firestore/categories";
import { saveVendorSuggestion } from "@/lib/firestore/vendorSuggestions";
import { saveRecurringTemplate } from "@/lib/firestore/recurringTemplates";
import { Category } from "@/types/category";

export async function migrateDemoDataToCloud(uid: string) {
  if (typeof window === "undefined") return;

  // 1. デモデータをローカルからロード
  const demoRecords = getDemoRecords(DEMO_USER_ID);
  const demoCategories = getDemoCategories(DEMO_USER_ID);
  const demoVendorSuggestions = getDemoVendorSuggestions(DEMO_USER_ID);
  const demoRecurringTemplates = getDemoRecurringTemplates(DEMO_USER_ID);

  // デモデータが何もなければマイグレーション不要
  if (
    demoRecords.length === 0 &&
    demoCategories.length === 0 &&
    demoVendorSuggestions.length === 0 &&
    demoRecurringTemplates.length === 0
  ) {
    return;
  }

  console.log("[migration] Migrating demo data to cloud user:", uid);

  // 2. クラウド側のカテゴリを準備 & 取得
  const cloudCategories = await ensureDefaultCategories(uid);
  const categoryIdMap: Record<string, string> = {};

  // クラウド側にあるカテゴリ名 -> ID のマッピング
  const cloudCategoryByName = new Map<string, string>();
  cloudCategories.forEach((cat) => {
    cloudCategoryByName.set(cat.name.trim(), cat.id);
  });

  // デモのカテゴリを移行
  for (const demoCat of demoCategories) {
    const trimmedName = demoCat.name.trim();
    if (cloudCategoryByName.has(trimmedName)) {
      // すでにクラウド側に同じ名前のカテゴリ（デフォルト含む）があればそれを使う
      categoryIdMap[demoCat.id] = cloudCategoryByName.get(trimmedName)!;
    } else {
      // なければ新しく作成する
      try {
        const newCatPayload: Category = {
          ...demoCat,
          userId: uid,
        };
        await saveCategory(newCatPayload);
        categoryIdMap[demoCat.id] = demoCat.id;
      } catch (e) {
        console.error("[migration] failed to migrate category:", demoCat.name, e);
      }
    }
  }

  // 3. レコードの移行
  for (const record of demoRecords) {
    try {
      const mappedCategoryId = record.categoryId ? categoryIdMap[record.categoryId] || record.categoryId : null;
      await saveRecord({
        ...record,
        userId: uid,
        categoryId: mappedCategoryId,
      });
    } catch (e) {
      console.error("[migration] failed to migrate record:", record.id, e);
    }
  }

  // 4. 取引先履歴の移行
  for (const suggestion of demoVendorSuggestions) {
    try {
      await saveVendorSuggestion(uid, suggestion.name);
    } catch (e) {
      console.error("[migration] failed to migrate vendor suggestion:", suggestion.name, e);
    }
  }

  // 5. 繰り返しテンプレートの移行
  for (const template of demoRecurringTemplates) {
    try {
      const mappedCategoryId = template.categoryId ? categoryIdMap[template.categoryId] || template.categoryId : null;
      await saveRecurringTemplate({
        ...template,
        userId: uid,
        categoryId: mappedCategoryId,
      });
    } catch (e) {
      console.error("[migration] failed to migrate recurring template:", template.id, e);
    }
  }

  console.log("[migration] Migration completed. Clearing demo data.");

  // 6. デモデータをローカルからクリア
  const KEYS = {
    profile: "keihi-pocket-demo-profile",
    records: "keihi-pocket-demo-records",
    categories: "keihi-pocket-demo-categories",
    vendorSuggestions: "keihi-pocket-demo-vendor-suggestions",
    recurring: "keihi-pocket-demo-recurring",
    session: "keihi-pocket-demo-session",
  };
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.records);
  localStorage.removeItem(KEYS.categories);
  localStorage.removeItem(KEYS.vendorSuggestions);
  localStorage.removeItem(KEYS.recurring);
  localStorage.removeItem(KEYS.session);
}
