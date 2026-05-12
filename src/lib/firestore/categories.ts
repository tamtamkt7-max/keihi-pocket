import { addDoc, collection, doc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Category } from "@/types/category";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { getDemoCategories, isDemoUserId, saveDemoCategory } from "@/lib/mock/localDb";

const defaultExpenseCategories = [
  "仕入れ",
  "交通費",
  "通信費",
  "消耗品",
  "外注費",
  "会議費",
  "新聞図書費",
  "広告宣伝費",
  "地代家賃",
  "水道光熱費",
  "雑費",
];

const defaultIncomeCategories = ["売上", "雑収入"];

function shouldUseDemoCategories(userId?: string) {
  return !firebaseEnabled || !db || isDemoUserId(userId);
}

export async function ensureDefaultCategories(userId: string) {
  if (shouldUseDemoCategories(userId)) {
    return getDemoCategories(userId);
  }
  const activeDb = db!;

  const existing = await getCategories(userId);
  if (existing.length > 0) return existing;

  const items: Omit<Category, "id">[] = [
    ...defaultExpenseCategories.map((name, index) => ({
      userId,
      name,
      type: "expense" as const,
      sortOrder: index,
      isDefault: true,
      isActive: true,
    })),
    ...defaultIncomeCategories.map((name, index) => ({
      userId,
      name,
      type: "income" as const,
      sortOrder: 100 + index,
      isDefault: true,
      isActive: true,
    })),
  ];

  await Promise.all(items.map((item) => addDoc(collection(activeDb, "categories"), item)));
  return getCategories(userId);
}

export async function getCategories(userId: string): Promise<Category[]> {
  if (shouldUseDemoCategories(userId)) {
    return getDemoCategories(userId);
  }

  const activeDb = db!;
  const q = query(collection(activeDb, "categories"), where("userId", "==", userId), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Category, "id">) }));
}

export async function saveCategory(category: Category) {
  if (shouldUseDemoCategories(category.userId)) {
    saveDemoCategory(category);
    return;
  }
  const activeDb = db!;
  await setDoc(doc(activeDb, "categories", category.id), category, { merge: true });
}
