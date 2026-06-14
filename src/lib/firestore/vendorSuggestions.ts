import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { getDemoVendorSuggestions, isDemoUserId, saveDemoVendorSuggestion } from "@/lib/mock/localDb";
import { VendorSuggestion } from "@/types/vendorSuggestion";
import { isUsableVendorName, normalizeVendorName } from "@/lib/vendors/vendorSuggestionRules";

function shouldUseDemoVendorSuggestions(userId?: string) {
  return !firebaseEnabled || !db || isDemoUserId(userId);
}

function userVendorSuggestionsCollection(userId: string) {
  return collection(db!, "users", userId, "vendorSuggestions");
}

function makeVendorSuggestionId(normalizedName: string) {
  const encoded = Array.from(normalizedName)
    .map((char) => char.codePointAt(0)?.toString(36) || "")
    .join("")
    .slice(0, 60);
  return `vendor_${encoded || Date.now()}`;
}

export async function getVendorSuggestions(userId: string): Promise<VendorSuggestion[]> {
  if (shouldUseDemoVendorSuggestions(userId)) {
    return getDemoVendorSuggestions(userId);
  }

  const snap = await getDocs(query(userVendorSuggestionsCollection(userId), orderBy("count", "desc"), limit(30)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<VendorSuggestion, "id">) }));
}

export async function saveVendorSuggestion(userId: string, name: string) {
  if (!isUsableVendorName(name)) return;
  const normalizedName = normalizeVendorName(name);
  const now = new Date().toISOString();
  const existing = (await getVendorSuggestions(userId)).find((item) => item.normalizedName === normalizedName);
  const suggestion: VendorSuggestion = {
    id: existing?.id || makeVendorSuggestionId(normalizedName),
    userId,
    name: name.trim(),
    normalizedName,
    count: (existing?.count || 0) + 1,
    lastUsedAt: now,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (shouldUseDemoVendorSuggestions(userId)) {
    saveDemoVendorSuggestion(suggestion);
    return;
  }

  await setDoc(doc(db!, "users", userId, "vendorSuggestions", suggestion.id), suggestion, { merge: true });
}
