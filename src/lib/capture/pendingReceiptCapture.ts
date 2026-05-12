const KEY = "keihi-pocket-pending-receipt-photo";

type PendingCapture = {
  dataUrl: string;
  name: string;
  type: string;
  savedAt: number;
};

export function savePendingReceiptCapture(file: File) {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const payload: PendingCapture = {
        dataUrl: String(reader.result || ""),
        name: file.name || `receipt-${Date.now()}.jpg`,
        type: file.type || "image/jpeg",
        savedAt: Date.now(),
      };
      window.sessionStorage.setItem(KEY, JSON.stringify(payload));
      resolve();
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function consumePendingReceiptCapture() {
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(KEY);

  try {
    const payload = JSON.parse(raw) as PendingCapture;
    if (!payload.dataUrl || Date.now() - payload.savedAt > 10 * 60 * 1000) return null;

    const response = await fetch(payload.dataUrl);
    const blob = await response.blob();
    return new File([blob], payload.name, { type: payload.type });
  } catch {
    return null;
  }
}
