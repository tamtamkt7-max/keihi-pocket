import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { firebaseEnabled } from "@/lib/runtime/appMode";

export interface ContactInput {
  name: string;
  email: string;
  category: string;
  message: string;
  deviceInfo?: string;
}

export async function saveContact(input: ContactInput) {
  const now = new Date().toISOString();

  if (!firebaseEnabled || !db) {
    // デモモードまたはFirebase未初期化時はローカルストレージにモック保存
    console.log("Demo Mode: Simulating contact submission", input);
    
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      const raw = window.localStorage.getItem("keihi-pocket-demo-contacts") || "[]";
      try {
        const contacts = JSON.parse(raw);
        contacts.push({ ...input, createdAt: now });
        window.localStorage.setItem("keihi-pocket-demo-contacts", JSON.stringify(contacts));
      } catch (e) {
        console.error("Failed to parse demo contacts", e);
        window.localStorage.setItem("keihi-pocket-demo-contacts", JSON.stringify([{ ...input, createdAt: now }]));
      }
    }
    // デモなので少しウェイトを入れて送信感を出す
    await new Promise((resolve) => setTimeout(resolve, 800));
    return;
  }

  // Firestore に保存
  await addDoc(collection(db, "contacts"), {
    ...input,
    createdAt: now,
  });
}
