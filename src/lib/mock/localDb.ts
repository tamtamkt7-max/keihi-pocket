import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { RecurringTemplate } from "@/types/recurring";
import { UserProfile } from "@/types/user";
import { VendorSuggestion } from "@/types/vendorSuggestion";
import { defaultCategories } from "@/lib/categories/defaultCategories";

const KEYS = {
  profile: "keihi-pocket-demo-profile",
  records: "keihi-pocket-demo-records",
  categories: "keihi-pocket-demo-categories",
  vendorSuggestions: "keihi-pocket-demo-vendor-suggestions",
  recurring: "keihi-pocket-demo-recurring",
};

export const DEMO_USER_ID = "demo-user";

const DEMO_STORAGE_QUOTA_ERROR = "DEMO_STORAGE_QUOTA_EXCEEDED";
const DATA_URL_PREFIX = /^data:/i;
const MAX_RECORDS = 300;
const MAX_RAW_TEXT_LENGTH = 4000;
const MAX_REDUCED_RAW_TEXT_LENGTH = 800;
const MAX_MEMO_LENGTH = 1000;
const MAX_INVOICE_MEMO_LENGTH = 200;
const MAX_VENDOR_NAME_LENGTH = 120;
const MAX_CANDIDATE_COUNT = 12;
const MAX_DEBUG_COUNT = 16;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isQuotaExceededError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED";
  }

  return error instanceof Error && /quota/i.test(error.message);
}

function trimText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}

function sanitizeCandidate(candidate: any) {
  return {
    value: Number(candidate?.value || 0),
    sourceLine: trimText(candidate?.sourceLine, 160),
    nearbyLabel: trimText(candidate?.nearbyLabel, 80),
    score: Number(candidate?.score || 0),
    reason: trimText(candidate?.reason, 200),
    excludedReason: candidate?.excludedReason ? trimText(candidate.excludedReason, 200) : undefined,
    selectedReason: candidate?.selectedReason ? trimText(candidate.selectedReason, 200) : undefined,
  };
}

function sanitizeDebugEntries(entries: any[] | undefined) {
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, MAX_DEBUG_COUNT).map((entry) => ({
    field: entry?.field === "date" || entry?.field === "amount" || entry?.field === "vendorName" ? entry.field : "vendorName",
    value: trimText(entry?.value, 120),
    confidence: Number(entry?.confidence || 0),
    reason: trimText(entry?.reason, 200),
  }));
}

function sanitizeOcrExtracted(extracted: RecordItem["ocrExtracted"], compact = false): RecordItem["ocrExtracted"] {
  if (!extracted || typeof extracted !== "object") return {};

  const amountCandidates = Array.isArray(extracted.amountCandidates)
    ? extracted.amountCandidates.slice(0, compact ? 6 : MAX_CANDIDATE_COUNT).map(sanitizeCandidate)
    : [];

  const dateCandidates = Array.isArray(extracted.dateCandidates)
    ? extracted.dateCandidates.slice(0, compact ? 4 : MAX_CANDIDATE_COUNT).map((value) => trimText(value, 40))
    : [];

  const vendorNameCandidates = Array.isArray(extracted.vendorNameCandidates)
    ? extracted.vendorNameCandidates.slice(0, compact ? 4 : MAX_CANDIDATE_COUNT).map((value) => trimText(value, 120))
    : [];

  return {
    ...extracted,
    date: extracted.date ? trimText(extracted.date, 40) : undefined,
    amount: typeof extracted.amount === "number" ? extracted.amount : undefined,
    vendorName: extracted.vendorName ? trimText(extracted.vendorName, MAX_VENDOR_NAME_LENGTH) : undefined,
    dateCandidates,
    amountCandidates,
    vendorNameCandidates,
    debug: extracted.debug
      ? {
          accepted: sanitizeDebugEntries(extracted.debug.accepted),
          rejected: sanitizeDebugEntries(extracted.debug.rejected),
        }
      : undefined,
  };
}

function isRecordItemLike(value: unknown): value is RecordItem {
  return Boolean(value && typeof value === "object" && "id" in value && "userId" in value);
}

function sanitizeRecordForDemo(item: RecordItem, compact = false): RecordItem {
  const imageUrls = Array.isArray(item.imageUrls)
    ? item.imageUrls.filter((url) => typeof url === "string" && url && !DATA_URL_PREFIX.test(url))
    : [];
  const thumbnailUrl =
    typeof item.thumbnailUrl === "string" && item.thumbnailUrl && !DATA_URL_PREFIX.test(item.thumbnailUrl)
      ? item.thumbnailUrl
      : null;

  return {
    ...item,
    vendorName: trimText(item.vendorName, MAX_VENDOR_NAME_LENGTH),
    memo: trimText(item.memo, compact ? 400 : MAX_MEMO_LENGTH),
    invoiceNumberMemo: trimText(item.invoiceNumberMemo, MAX_INVOICE_MEMO_LENGTH),
    imageUrls: compact ? [] : imageUrls,
    thumbnailUrl: compact ? null : thumbnailUrl,
    ocrRawText: trimText(item.ocrRawText, compact ? MAX_REDUCED_RAW_TEXT_LENGTH : MAX_RAW_TEXT_LENGTH),
    ocrExtracted: sanitizeOcrExtracted(item.ocrExtracted, compact),
  };
}

function sanitizeStoredRecords(value: unknown, compact = false) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecordItemLike)
    .map((item) => sanitizeRecordForDemo(item, compact))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, MAX_RECORDS);
}

function writeRawJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function tryWriteRecordsWithFallback(items: RecordItem[]) {
  const attempts = [
    sanitizeStoredRecords(items, false),
    sanitizeStoredRecords(items, true),
    sanitizeStoredRecords(items, true).slice(0, 150),
    sanitizeStoredRecords(items, true).slice(0, 80),
  ];

  for (const candidate of attempts) {
    try {
      writeRawJson(KEYS.records, candidate);
      return;
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        throw error;
      }
    }
  }

  throw new Error(DEMO_STORAGE_QUOTA_ERROR);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as T;

    if (key === KEYS.records) {
      const sanitized = sanitizeStoredRecords(parsed, false);
      const serializedSanitized = JSON.stringify(sanitized);
      if (serializedSanitized !== raw) {
        try {
          writeRawJson(KEYS.records, sanitized);
        } catch {
          // Ignore cleanup failures while reading. We still return the sanitized data.
        }
      }
      return sanitized as T;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;

  try {
    if (key === KEYS.records) {
      tryWriteRecordsWithFallback(sanitizeStoredRecords(value, false));
      return;
    }

    writeRawJson(key, value);
  } catch (error) {
    if (key === KEYS.records && isQuotaExceededError(error)) {
      throw new Error(DEMO_STORAGE_QUOTA_ERROR);
    }
    throw error;
  }
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function isDemoStorageQuotaError(error: unknown) {
  return error instanceof Error && error.message === DEMO_STORAGE_QUOTA_ERROR;
}

export function isDemoUserId(userId?: string | null) {
  return userId === DEMO_USER_ID;
}

export function clearDemoSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem("keihi-pocket-demo-session");
}

export function setDemoSession() {
  if (!canUseStorage()) return;
  window.localStorage.setItem("keihi-pocket-demo-session", "1");
}

export function hasDemoSession() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem("keihi-pocket-demo-session") === "1";
}

export function getDemoProfile(): UserProfile {
  const existing = readJson<UserProfile | null>(KEYS.profile, null);
  if (existing) return existing;
  const now = new Date().toISOString();
  const profile: UserProfile = {
    id: DEMO_USER_ID,
    displayName: "お試しユーザー",
    email: "demo@example.com",
    businessName: "",
    fiscalYearStartMonth: 1,
    defaultBusinessUsePercent: 100,
    defaultTaxType: "inclusive",
    createdAt: now,
    updatedAt: now,
  };
  writeJson(KEYS.profile, profile);
  return profile;
}

export function saveDemoProfile(profile: UserProfile) {
  writeJson(KEYS.profile, { ...profile, updatedAt: new Date().toISOString() });
}

export function getDemoCategories(userId: string): Category[] {
  const existing = readJson<Category[]>(KEYS.categories, []);
  const userItems = existing.filter((item) => item.userId === userId);
  const existingNames = new Set(userItems.map((item) => item.name.trim()));
  const missing = defaultCategories.filter((item) => !existingNames.has(item.name));
  if (userItems.length > 0 && missing.length === 0) return userItems;

  const seeded: Category[] = [
    ...existing,
    ...missing.map((item) => ({
      id: makeId("cat"),
      userId,
      ...item,
    })),
  ];
  writeJson(KEYS.categories, seeded);
  return seeded.filter((item) => item.userId === userId);
}

export function saveDemoCategory(category: Category) {
  const items = readJson<Category[]>(KEYS.categories, []);
  const next = items.some((item) => item.id === category.id) ? items.map((item) => (item.id === category.id ? category : item)) : [...items, category];
  writeJson(KEYS.categories, next);
}

export function getDemoVendorSuggestions(userId: string): VendorSuggestion[] {
  return readJson<VendorSuggestion[]>(KEYS.vendorSuggestions, [])
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.count - a.count || b.lastUsedAt.localeCompare(a.lastUsedAt))
    .slice(0, 30);
}

export function saveDemoVendorSuggestion(suggestion: VendorSuggestion) {
  const items = readJson<VendorSuggestion[]>(KEYS.vendorSuggestions, []);
  const next = items.some((item) => item.id === suggestion.id)
    ? items.map((item) => (item.id === suggestion.id ? suggestion : item))
    : [...items, suggestion];
  writeJson(KEYS.vendorSuggestions, next.slice(-200));
}

export function getDemoRecords(userId: string): RecordItem[] {
  return readJson<RecordItem[]>(KEYS.records, []).filter((item) => item.userId === userId);
}

export function getDemoRecordById(id: string): RecordItem | null {
  return readJson<RecordItem[]>(KEYS.records, []).find((item) => item.id === id) || null;
}

export function saveDemoRecord(item: RecordItem) {
  const items = readJson<RecordItem[]>(KEYS.records, []);
  const safeItem = sanitizeRecordForDemo(item, false);
  const next = items.some((current) => current.id === safeItem.id)
    ? items.map((current) => (current.id === safeItem.id ? safeItem : current))
    : [...items, safeItem];
  writeJson(KEYS.records, next);
}

export function createDemoRecordId() {
  return makeId("rec");
}

export function deleteDemoRecord(id: string) {
  const items = readJson<RecordItem[]>(KEYS.records, []);
  writeJson(KEYS.records, items.filter((item) => item.id !== id));
}

export function getDemoRecurringTemplates(userId: string): RecurringTemplate[] {
  return readJson<RecurringTemplate[]>(KEYS.recurring, []).filter((item) => item.userId === userId);
}

export function saveDemoRecurringTemplate(item: RecurringTemplate) {
  const items = readJson<RecurringTemplate[]>(KEYS.recurring, []);
  const next = items.some((current) => current.id === item.id) ? items.map((current) => (current.id === item.id ? item : current)) : [...items, item];
  writeJson(KEYS.recurring, next);
}

export function createDemoRecurringId() {
  return makeId("recurring");
}

export function deleteDemoRecurringTemplate(id: string) {
  const items = readJson<RecurringTemplate[]>(KEYS.recurring, []);
  writeJson(KEYS.recurring, items.filter((item) => item.id !== id));
}
