import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { RecurringTemplate } from "@/types/recurring";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import {
  createDemoRecurringId,
  deleteDemoRecurringTemplate,
  getDemoRecurringTemplates,
  hasDemoSession,
  isDemoUserId,
  saveDemoRecurringTemplate,
} from "@/lib/mock/localDb";

function shouldUseDemoRecurring(userId?: string) {
  return !firebaseEnabled || !db || isDemoUserId(userId) || (!userId && hasDemoSession());
}

export async function getRecurringTemplates(userId: string): Promise<RecurringTemplate[]> {
  if (shouldUseDemoRecurring(userId)) {
    return getDemoRecurringTemplates(userId).sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }
  const activeDb = db!;
  const q = query(collection(activeDb, "recurringTemplates"), where("userId", "==", userId), orderBy("dayOfMonth", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<RecurringTemplate, "id">) }));
}

export async function saveRecurringTemplate(input: Partial<RecurringTemplate> & { userId: string; id?: string }) {
  const now = new Date().toISOString();
  if (shouldUseDemoRecurring(input.userId)) {
    const id = input.id || createDemoRecurringId();
    saveDemoRecurringTemplate({
      id,
      userId: input.userId,
      name: input.name || "",
      recordType: input.recordType || "expense",
      amount: Number(input.amount || 0),
      vendorName: input.vendorName || "",
      categoryId: input.categoryId ?? null,
      paymentMethod: input.paymentMethod || "cash",
      businessUsePercent: Number(input.businessUsePercent ?? 100),
      taxType: input.taxType || "inclusive",
      taxRate: input.taxRate ?? 10,
      memo: input.memo || "",
      dayOfMonth: Number(input.dayOfMonth || 1),
      isAutoCreate: Boolean(input.isAutoCreate),
      isActive: input.isActive ?? true,
      createdAt: input.createdAt || now,
      updatedAt: now,
    });
    return id;
  }

  const activeDb = db!;

  if (input.id) {
    await setDoc(doc(activeDb, "recurringTemplates", input.id), { ...input, updatedAt: now }, { merge: true });
    return input.id;
  }

  const created = await addDoc(collection(activeDb, "recurringTemplates"), { ...input, createdAt: now, updatedAt: now });
  return created.id;
}

export async function deleteRecurringTemplate(id: string) {
  if (shouldUseDemoRecurring()) {
    deleteDemoRecurringTemplate(id);
    return;
  }
  const activeDb = db!;
  await deleteDoc(doc(activeDb, "recurringTemplates", id));
}
