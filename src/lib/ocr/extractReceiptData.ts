"use client";

import { OcrExtracted } from "@/types/record";
import { createFallbackLines, extractReceiptFields } from "@/lib/receipt/extractReceiptFields";
import { HighAccuracyReceiptResponse } from "@/lib/receipt/highAccuracyReceipt";

type ReceiptAnalyzeResponse = {
  rawText: string;
  extracted: OcrExtracted;
  provider: "vision" | "fallback";
};

const MAX_CLIENT_IMAGE_EDGE = 1800;
const CLIENT_COMPRESS_THRESHOLD = 2.5 * 1024 * 1024;
const HIGH_ACCURACY_IMAGE_EDGE = 1400;
const HIGH_ACCURACY_IMAGE_QUALITY = 0.8;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    image.src = url;
  });
}

async function normalizeImageForUpload(file: File) {
  const lowerName = file.name.toLowerCase();
  const mayNeedConversion =
    file.size > CLIENT_COMPRESS_THRESHOLD ||
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lowerName.endsWith(".heic") ||
    lowerName.endsWith(".heif");

  if (!mayNeedConversion) return file;

  try {
    const image = await loadImageFromFile(file);
    const scale = Math.min(1, MAX_CLIENT_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
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

    return new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export async function prepareReceiptImageForUpload(file: File) {
  return normalizeImageForUpload(file);
}

async function resizeImageForHighAccuracy(file: File) {
  try {
    const image = await loadImageFromFile(file);
    const scale = Math.min(1, HIGH_ACCURACY_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return normalizeImageForUpload(file);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", HIGH_ACCURACY_IMAGE_QUALITY));
    if (!blob) return normalizeImageForUpload(file);
    return new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return normalizeImageForUpload(file);
  }
}

async function runFallback(file: File): Promise<ReceiptAnalyzeResponse> {
  const Tesseract = (await import("tesseract.js")).default;
  const result = await Tesseract.recognize(file, "jpn+eng", {
    logger: () => undefined,
  });

  const rawText = result.data.text || "";
  const analysis = extractReceiptFields(rawText, createFallbackLines(rawText), "fallback");

  return {
    rawText: analysis.rawText,
    extracted: analysis.extracted,
    provider: "fallback",
  };
}

export async function extractReceiptData(file: File): Promise<ReceiptAnalyzeResponse> {
  const uploadFile = await normalizeImageForUpload(file);
  try {
    const formData = new FormData();
    formData.append("file", uploadFile);

    const response = await fetch("/api/receipt-analyze", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = (await response.json()) as ReceiptAnalyzeResponse;
      return data;
    }
  } catch {
    // Fall back to local recognition below.
  }

  return runFallback(file);
}

export async function extractReceiptDataHighAccuracy(file: File, idToken: string): Promise<HighAccuracyReceiptResponse> {
  const uploadFile = await resizeImageForHighAccuracy(file);
  const formData = new FormData();
  formData.append("file", uploadFile);

  try {
    const response = await fetch("/api/receipt/ai-extract", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });
    const data = (await response.json()) as HighAccuracyReceiptResponse;
    if (!response.ok) {
      return {
        available: false,
        message: data.message || "うまく読み取れませんでした。手入力できます。",
      };
    }
    return data;
  } catch (error) {
    console.error("high accuracy receipt extraction failed", error);
    return {
      available: false,
      message: "うまく読み取れませんでした。手入力できます。",
    };
  }
}
