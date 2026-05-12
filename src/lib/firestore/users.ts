import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { UserProfile } from "@/types/user";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { getDemoProfile, isDemoUserId, saveDemoProfile } from "@/lib/mock/localDb";

function shouldUseDemoProfile(userId?: string) {
  return !firebaseEnabled || !db || isDemoUserId(userId);
}

export async function ensureUserProfile(input: {
  id: string;
  displayName: string;
  email: string;
}): Promise<UserProfile> {
  if (shouldUseDemoProfile(input.id)) {
    return getDemoProfile();
  }

  const activeDb = db!;
  const ref = doc(activeDb, "users", input.id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: input.id,
      displayName: input.displayName || "",
      email: input.email || "",
      businessName: "",
      fiscalYearStartMonth: 1,
      defaultBusinessUsePercent: 100,
      defaultTaxType: "inclusive",
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, profile);
    return profile;
  }

  return snap.data() as UserProfile;
}

export async function saveUserProfile(profile: UserProfile) {
  if (shouldUseDemoProfile(profile.id)) {
    saveDemoProfile(profile);
    return;
  }
  const activeDb = db!;
  await setDoc(
    doc(activeDb, "users", profile.id),
    {
      ...profile,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
