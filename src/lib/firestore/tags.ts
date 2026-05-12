import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { Tag } from "@/types/tag";

export async function getTags(userId: string): Promise<Tag[]> {
  if (!firebaseEnabled || !db) return [];

  const q = query(collection(db, "tags"), where("userId", "==", userId), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Tag, "id">) }));
}

export async function createTag(userId: string, name: string) {
  if (!firebaseEnabled || !db) return null;

  const current = await getTags(userId);
  return addDoc(collection(db, "tags"), {
    userId,
    name,
    sortOrder: current.length,
    isActive: true,
  });
}
