import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { calculateBusinessAmount } from "@/lib/calculations/businessAmount";
import { getFiscalYear } from "@/lib/calculations/fiscalYear";
import { generateYearMonthKey } from "@/lib/utils/generateYearMonthKey";
import { db } from "@/lib/firebase/client";
import { RecordItem } from "@/types/record";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import {
  createDemoRecordId,
  deleteDemoRecord,
  getDemoRecordById,
  getDemoRecords,
  hasDemoSession,
  isDemoUserId,
  saveDemoRecord,
} from "@/lib/mock/localDb";
import { deleteRecordImageByUrl } from "@/lib/storage/deleteRecordImage";

function shouldUseDemoRecords(userId?: string) {
  return !firebaseEnabled || !db || isDemoUserId(userId) || (!userId && hasDemoSession());
}

function userRecordsCollection(userId: string) {
  return collection(db!, "users", userId, "records");
}

function userRecordDocument(userId: string, recordId: string) {
  return doc(db!, "users", userId, "records", recordId);
}

function normalizeRecord(item: Partial<RecordItem>, fiscalYearStartMonth = 1): Omit<RecordItem, "id"> {
  const now = new Date().toISOString();
  const txDate = item.transactionDate || now.slice(0, 10);
  const ym = generateYearMonthKey(txDate);
  return {
    userId: item.userId || "",
    recordType: item.recordType || "expense",
    documentType: item.documentType || "receipt",
    transactionDate: txDate,
    amount: Number(item.amount || 0),
    vendorName: item.vendorName || "",
    categoryId: item.categoryId ?? null,
    categoryName: item.categoryName || "",
    tagIds: item.tagIds || [],
    paymentMethod: item.paymentMethod || "cash",
    usageType: item.usageType || "spending",
    businessUsePercent: Number(item.businessUsePercent ?? 100),
    calculatedBusinessAmount: calculateBusinessAmount(Number(item.amount || 0), Number(item.businessUsePercent ?? 100)),
    taxType: item.taxType || "inclusive",
    taxRate: item.taxRate ?? 10,
    taxAmount: item.taxAmount ?? null,
    invoiceNumberMemo: item.invoiceNumberMemo || "",
    memo: item.memo || "",
    status: item.status || "unconfirmed",
    imageUrls: item.imageUrls || [],
    thumbnailUrl: item.thumbnailUrl ?? item.imageUrls?.[0] ?? null,
    ocrRawText: item.ocrRawText || "",
    ocrExtracted: item.ocrExtracted || {},
    recurringTemplateId: item.recurringTemplateId ?? null,
    fiscalYear: getFiscalYear(txDate, fiscalYearStartMonth),
    transactionMonth: ym.transactionMonth,
    transactionYearMonthKey: ym.transactionYearMonthKey,
    createdAt: item.createdAt || now,
    updatedAt: now,
  };
}

export async function saveRecord(input: Partial<RecordItem> & { userId: string; id?: string; fiscalYearStartMonth?: number }) {
  const payload = normalizeRecord(input, input.fiscalYearStartMonth || 1);
  if (shouldUseDemoRecords(input.userId)) {
    const id = input.id || createDemoRecordId();
    saveDemoRecord({ id, ...payload });
    return id;
  }

  if (input.id) {
    const payloadForUpdate =
      input.createdAt
        ? payload
        : {
            ...payload,
            createdAt: undefined,
          };

    await setDoc(userRecordDocument(input.userId, input.id), payloadForUpdate, { merge: true });
    return input.id;
  }

  const created = await addDoc(userRecordsCollection(input.userId), payload);
  return created.id;
}

export async function getRecords(userId: string): Promise<RecordItem[]> {
  if (shouldUseDemoRecords(userId)) {
    return getDemoRecords(userId).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }

  const q = query(userRecordsCollection(userId), orderBy("transactionDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<RecordItem, "id">) }));
}

export async function getRecentRecords(userId: string): Promise<RecordItem[]> {
  if (shouldUseDemoRecords(userId)) {
    return getDemoRecords(userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }

  const q = query(userRecordsCollection(userId), orderBy("createdAt", "desc"), limit(5));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<RecordItem, "id">) }));
}

export async function getRecordById(id: string, userId?: string): Promise<RecordItem | null> {
  if (shouldUseDemoRecords(userId)) {
    return getDemoRecordById(id);
  }

  if (!userId) return null;

  const snap = await getDoc(userRecordDocument(userId, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<RecordItem, "id">) };
}

export async function deleteRecord(id: string, userId?: string) {
  if (shouldUseDemoRecords(userId)) {
    deleteDemoRecord(id);
    return;
  }

  if (!userId) return;

  const existing = await getRecordById(id, userId);
  if (!existing) return;

  if (existing.imageUrls?.length) {
    await Promise.all(existing.imageUrls.map((url) => deleteRecordImageByUrl(url)));
  }

  await deleteDoc(userRecordDocument(userId, id));
}
