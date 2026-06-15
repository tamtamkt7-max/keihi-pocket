const DB_NAME = "keihi-pocket-capture";
const STORE_NAME = "pendingReceiptCapture";
const PENDING_KEY = "latest";
const SESSION_KEY = "keihi-pocket-pending-receipt-photo";
const EVENT_NAME = "keihi-pocket:pending-receipt-capture";
const MAX_AGE_MS = 10 * 60 * 1000;

type PendingCapture = {
  file?: Blob;
  dataUrl?: string;
  name: string;
  type: string;
  savedAt: number;
};

function hasIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openCaptureDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIndexedDb(file: File) {
  if (!hasIndexedDb()) throw new Error("IndexedDB is not available");
  const db = await openCaptureDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(
      {
        file,
        name: file.name || `receipt-${Date.now()}.jpg`,
        type: file.type || "image/jpeg",
        savedAt: Date.now(),
      } satisfies PendingCapture,
      PENDING_KEY
    );
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function readFromIndexedDb() {
  if (!hasIndexedDb()) return null;
  const db = await openCaptureDb();
  const payload = await new Promise<PendingCapture | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PENDING_KEY);
    request.onsuccess = () => {
      const value = (request.result as PendingCapture | undefined) || null;
      store.delete(PENDING_KEY);
      resolve(value);
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return payload;
}

function saveToSessionStorage(file: File) {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const payload: PendingCapture = {
        dataUrl: String(reader.result || ""),
        name: file.name || `receipt-${Date.now()}.jpg`,
        type: file.type || "image/jpeg",
        savedAt: Date.now(),
      };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      resolve();
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function readFromSessionStorage() {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(SESSION_KEY);

  const payload = JSON.parse(raw) as PendingCapture;
  if (!payload.dataUrl) return null;
  return payload;
}

function toFile(payload: PendingCapture) {
  if (Date.now() - payload.savedAt > MAX_AGE_MS) return null;
  if (payload.file instanceof File) return payload.file;
  if (payload.file instanceof Blob) {
    return new File([payload.file], payload.name, { type: payload.type || payload.file.type || "image/jpeg" });
  }
  if (!payload.dataUrl) return null;

  return fetch(payload.dataUrl)
    .then((response) => response.blob())
    .then((blob) => new File([blob], payload.name, { type: payload.type }));
}

export async function savePendingReceiptCapture(file: File) {
  try {
    await saveToIndexedDb(file);
  } catch (error) {
    console.warn("pending receipt capture indexedDB save failed", error);
    await saveToSessionStorage(file);
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export async function consumePendingReceiptCapture() {
  try {
    const payload = (await readFromIndexedDb()) || (await readFromSessionStorage());
    if (!payload) return null;
    return await toFile(payload);
  } catch (error) {
    console.warn("pending receipt capture consume failed", error);
    return null;
  }
}

export function listenPendingReceiptCapture(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
