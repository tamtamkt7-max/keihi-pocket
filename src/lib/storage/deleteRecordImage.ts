import { deleteObject, ref } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { cloudImageSaveEnabled, firebaseEnabled } from "@/lib/runtime/appMode";

export async function deleteRecordImageByUrl(url: string) {
  if (!firebaseEnabled || !cloudImageSaveEnabled || !storage) return;

  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Firebase Storage URLs can already be gone; record deletion should continue.
  }
}
