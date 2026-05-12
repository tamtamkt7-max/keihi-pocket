import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { cloudImageSaveEnabled, firebaseEnabled } from "@/lib/runtime/appMode";
import { isDemoUserId } from "@/lib/mock/localDb";

const MAX_UPLOAD_EDGE = 1800;

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image();
      next.onload = () => resolve(next);
      next.onerror = () => reject(new Error("image decode failed"));
      next.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareImageForUpload(file: File) {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml") return file;

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    if (scale >= 0.98 && file.size <= 2_200_000) {
      return file;
    }

    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export async function uploadRecordImages({ userId, recordId, files }: { userId: string; recordId: string; files: File[] }) {
  if (!firebaseEnabled || !cloudImageSaveEnabled || !storage || isDemoUserId(userId)) {
    return [];
  }

  const activeStorage = storage;
  if (!activeStorage) return [];

  const preparedFiles = await Promise.all(files.map((file) => prepareImageForUpload(file)));

  const uploaded = await Promise.all(
    preparedFiles.map(async (file, index) => {
      const path = `users/${userId}/records/${recordId}/${Date.now()}-${index}-${file.name}`;
      const fileRef = ref(activeStorage, path);
      await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
      return getDownloadURL(fileRef);
    })
  );

  return uploaded;
}
