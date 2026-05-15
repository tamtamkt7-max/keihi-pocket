import { addDoc, collection, doc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Category } from "@/types/category";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { getDemoCategories, isDemoUserId, saveDemoCategory } from "@/lib/mock/localDb";
import { defaultCategories } from "@/lib/categories/defaultCategories";

function shouldUseDemoCategories(userId?: string) {
  return !firebaseEnabled || !db || isDemoUserId(userId);
}

export async function ensureDefaultCategories(userId: string) {
  if (shouldUseDemoCategories(userId)) {
    return getDemoCategories(userId);
  }
  const activeDb = db!;

  const existing = await getCategories(userId);
  const existingNames = new Set(existing.map((item) => item.name.trim()));
  const missing = defaultCategories.filter((item) => !existingNames.has(item.name));
  if (missing.length === 0) return existing;

  const items: Omit<Category, "id">[] = [
    ...missing.map((item) => ({
      userId,
      ...item,
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
