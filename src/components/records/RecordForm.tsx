"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { Camera, CheckCircle2, ImagePlus, Keyboard, LoaderCircle, WalletCards } from "lucide-react";
import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { consumePendingReceiptCapture, listenPendingReceiptCapture } from "@/lib/capture/pendingReceiptCapture";
import { recordSchema } from "@/lib/validations/recordSchema";
import { saveRecord } from "@/lib/firestore/records";
import { saveCategory } from "@/lib/firestore/categories";
import { uploadRecordImages } from "@/lib/storage/uploadRecordImages";
import { extractReceiptData, extractReceiptDataHighAccuracy } from "@/lib/ocr/extractReceiptData";
import { isDemoStorageQuotaError } from "@/lib/mock/localDb";
import { auth } from "@/lib/firebase/client";
import { getVendorSuggestions, saveVendorSuggestion } from "@/lib/firestore/vendorSuggestions";
import { getDefaultCategoriesForRecordType, getDefaultCategoryById } from "@/lib/categories/defaultCategories";
import { HighAccuracyReceiptResult, isUsefulCategoryName } from "@/lib/receipt/highAccuracyReceipt";
import { VendorSuggestion } from "@/types/vendorSuggestion";
import { findVendorSuggestion, isUsableVendorName } from "@/lib/vendors/vendorSuggestionRules";
import { ImageUploader } from "./ImageUploader";
import { OcrCandidatePanel } from "./OcrCandidatePanel";
import { RecordTypeTabs } from "./RecordTypeTabs";
import { RecordBasicFields } from "./RecordBasicFields";
import { RecordAdvancedFields } from "./RecordAdvancedFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type EntryMode = "camera" | "upload" | "manual" | "income";
type FieldSource = "empty" | "auto-basic" | "auto-high" | "user-edited";
type FieldKey = "transactionDate" | "amount" | "vendorName" | "categoryId" | "categoryName" | "paymentMethod" | "memo" | "usageType";
type ReadLimitState = {
  rewardAdAvailable: boolean;
  rewardBonusReads: number;
  rewardAdWatchedCount: number;
  rewardAdDailyLimit: number;
};
type RewardAdWindow = Window & {
  keihiPocketRewardAds?: {
    show: () => boolean | Promise<boolean>;
  };
};

type Props = {
  userId: string;
  fiscalYearStartMonth: number;
  categories: Category[];
  categoriesLoading?: boolean;
  initial?: RecordItem | null;
  defaultType?: "expense" | "income";
  initialEntryMode?: EntryMode;
};

const SHOW_RECEIPT_DEBUG =
  process.env.NEXT_PUBLIC_SHOW_RECEIPT_DEBUG === "true" ||
  process.env.NEXT_PUBLIC_SHOW_RECEIPT_DEBUG === "1";

function waitForCurrentUser(timeoutMs = 3000) {
  return new Promise<User | null>((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const authInstance = auth;

    let settled = false;
    let timer: number | undefined;
    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      unsubscribe();
      resolve(user);
    };
    const unsubscribe = onAuthStateChanged(authInstance, (user) => finish(user));
    timer = window.setTimeout(() => finish(authInstance.currentUser), timeoutMs);
  });
}

export function RecordForm({
  userId,
  fiscalYearStartMonth,
  categories,
  categoriesLoading = false,
  initial,
  defaultType = "expense",
  initialEntryMode = "camera",
}: Props) {
  const router = useRouter();
  const consumedPending = useRef(false);
  const fieldSourcesRef = useRef<Record<string, FieldSource>>({});
  const highAccuracyCacheRef = useRef<{ key: string; result: HighAccuracyReceiptResult } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [highAccuracyLoading, setHighAccuracyLoading] = useState(false);
  const [highAccuracyMessage, setHighAccuracyMessage] = useState("");
  const [readLimitState, setReadLimitState] = useState<ReadLimitState | null>(null);
  const [rewardAdReady, setRewardAdReady] = useState(false);
  const [vendorSuggestions, setVendorSuggestions] = useState<VendorSuggestion[]>([]);
  const [scanState, setScanState] = useState<"idle" | "reading" | "filled" | "partial" | "failed">("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [entryMode, setEntryMode] = useState<EntryMode>(
    initial ? (initial.recordType === "income" ? "income" : "manual") : initialEntryMode
  );
  const [started, setStarted] = useState(true);
  const [selectingPhotoMode, setSelectingPhotoMode] = useState(false);
  const [values, setValues] = useState({
    recordType: initial?.recordType || (initialEntryMode === "income" ? "income" : defaultType),
    documentType: initial?.documentType || "receipt",
    transactionDate: initial?.transactionDate || new Date().toISOString().slice(0, 10),
    amount: initial?.amount || 0,
    vendorName: initial?.vendorName || "",
    categoryId: initial?.categoryId || null,
    categoryName: initial?.categoryName || "",
    tagIds: initial?.tagIds || [],
    paymentMethod: initial?.paymentMethod || "cash",
    usageType: initial ? initial.usageType || "spending" : "business_expense",
    businessUsePercent: initial?.businessUsePercent ?? 100,
    taxType: initial?.taxType || "inclusive",
    taxRate: initial?.taxRate ?? 10,
    taxAmount: initial?.taxAmount ?? null,
    invoiceNumberMemo: initial?.invoiceNumberMemo || "",
    memo: initial?.memo || "",
    status: initial?.status || "unconfirmed",
    recurringTemplateId: initial?.recurringTemplateId || null,
    imageUrls: initial?.imageUrls || [],
    thumbnailUrl: initial?.thumbnailUrl || null,
    ocrRawText: initial?.ocrRawText || "",
    ocrExtracted: initial?.ocrExtracted || {},
    createdAt: initial?.createdAt || "",
    updatedAt: initial?.updatedAt || "",
  });

  const previews = useMemo(() => {
    const fromFiles = files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    const fromSaved = values.imageUrls.map((url, index) => ({ url, name: `saved-${index}` }));
    return [...fromSaved, ...fromFiles];
  }, [files, values.imageUrls]);

  async function loadPendingCapture() {
    const pending = await consumePendingReceiptCapture();
    if (!pending) return;
    setStarted(true);
    setSelectingPhotoMode(false);
    setEntryMode("camera");
    setFiles([pending]);
    await fillFromPhoto(pending);
  }

  useEffect(() => {
    if (initial || consumedPending.current) return;
    consumedPending.current = true;
    void loadPendingCapture();
  }, [initial]);

  useEffect(() => {
    if (initial) return;
    return listenPendingReceiptCapture(() => {
      void loadPendingCapture();
    });
  }, [initial]);

  useEffect(() => {
    let mounted = true;
    getVendorSuggestions(userId)
      .then((items) => {
        if (mounted) setVendorSuggestions(items);
      })
      .catch((error) => {
        console.warn("vendor suggestions load failed", error);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const checkRewardAdReady = () => {
      setRewardAdReady(typeof (window as RewardAdWindow).keihiPocketRewardAds?.show === "function");
    };
    checkRewardAdReady();
    const timer = window.setInterval(checkRewardAdReady, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function updateValue(key: string, value: any) {
    fieldSourcesRef.current = { ...fieldSourcesRef.current, [key]: "user-edited" };
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function canAutoReplace(key: FieldKey) {
    const source = fieldSourcesRef.current[key] || "empty";
    return source === "empty" || source === "auto-basic" || source === "auto-high";
  }

  function markAutoSource(key: FieldKey, source: Extract<FieldSource, "auto-basic" | "auto-high">) {
    const current = fieldSourcesRef.current[key] || "empty";
    if (current === "user-edited") return;
    fieldSourcesRef.current = { ...fieldSourcesRef.current, [key]: source };
  }

  function getFileCacheKey(file: File) {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  function isHighAccuracyResultUseful(result: HighAccuracyReceiptResult) {
    return Boolean(result.date || typeof result.amount === "number" || result.vendor || result.categorySuggestion);
  }

  function findCategoryBySuggestion(suggestion?: string | null) {
    const source = (suggestion || "").trim();
    const mappedName = mapCategorySuggestion(source);
    const name = mappedName || source;
    if (!name) return undefined;
    const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();
    const candidates = [...categories, ...getDefaultCategoriesForRecordType(values.recordType)]
      .filter((item) => item.isActive !== false)
      .filter((item, index, all) => all.findIndex((other) => other.name === item.name) === index);
    return (
      candidates.find((item) => normalize(item.name) === normalize(name)) ||
      candidates.find((item) => normalize(item.name).includes(normalize(name)) || normalize(name).includes(normalize(item.name)))
    );
  }

  function mapCategorySuggestion(value: string) {
    const text = value.trim();
    if (!text) return "";
    if (/ガソリン|給油|レギュラー|軽油|灯油|燃料/i.test(text)) return "ガソリン代";
    if (/駐車|パーキング|コインパーキング/i.test(text)) return "旅費交通費";
    if (/交通|電車|バス|タクシー/i.test(text)) return "旅費交通費";
    if (/飲食|カフェ|喫茶|レストラン|食堂|居酒屋/i.test(text)) return "飲食費";
    if (/コンビニ|セブン|ローソン|ファミリーマート|ファミマ|ミニストップ/i.test(text)) return "コンビニ";
    if (/Amazon|アマゾン|楽天|通販|ネットショップ/i.test(text)) return "消耗品費";
    if (/備品|家電|家具|什器/i.test(text)) return "消耗品費";
    return text;
  }

  function pickVendorName(value?: string | null) {
    const name = (value || "").trim();
    const suggestion = name ? findVendorSuggestion(name, vendorSuggestions) : null;
    if (suggestion && (!isUsableVendorName(name) || suggestion.name !== name)) return suggestion.name;
    return name;
  }

  function beginMode(mode: EntryMode) {
    setStarted(true);
    setSelectingPhotoMode(false);
    setEntryMode(mode);

    if (mode === "income") {
      setValues((prev) => ({
        ...prev,
        recordType: "income",
        documentType: "other",
        paymentMethod: "bank",
      }));
      return;
    }

    setValues((prev) => ({
      ...prev,
      recordType: "expense",
      documentType: prev.documentType || "receipt",
    }));
  }

  function applyBasicReceiptResult(result: Awaited<ReturnType<typeof extractReceiptData>>) {
    setValues((prev) => {
      const next = {
        ...prev,
        ocrRawText: result.rawText,
        ocrExtracted: result.extracted,
      };
      if (canAutoReplace("transactionDate") && result.extracted.date) {
        next.transactionDate = result.extracted.date;
        markAutoSource("transactionDate", "auto-basic");
      }
      if (canAutoReplace("amount") && typeof result.extracted.amount === "number") {
        next.amount = result.extracted.amount;
        markAutoSource("amount", "auto-basic");
      }
      const vendorName = pickVendorName(result.extracted.vendorName);
      if (canAutoReplace("vendorName") && vendorName) {
        next.vendorName = vendorName;
        markAutoSource("vendorName", "auto-basic");
      }
      return next;
    });
    setScanState(result.extracted.date && result.extracted.amount && result.extracted.vendorName ? "filled" : "partial");
  }

  async function runBasicReceiptRead(file: File) {
    try {
      const result = await extractReceiptData(file);
      applyBasicReceiptResult(result);
      return true;
    } catch (error) {
      console.error("receipt read failed", error);
      return false;
    }
  }

  function applyHighAccuracyResult(result: HighAccuracyReceiptResult) {
    const categorySource = [
      result.categorySuggestion || "",
      result.vendor || "",
      ...result.items.map((item) => item.name || ""),
    ].join(" ");
    const category = findCategoryBySuggestion(categorySource);
    const mappedCategoryName = mapCategorySuggestion(categorySource);
    let keptUserInput = false;
    setValues((prev) => {
      const next = { ...prev };
      if (canAutoReplace("transactionDate") && result.date && result.confidence.date >= 0.55) {
        next.transactionDate = result.date;
        markAutoSource("transactionDate", "auto-high");
      } else if (!canAutoReplace("transactionDate") && result.date) {
        keptUserInput = true;
      }
      if (canAutoReplace("amount") && typeof result.amount === "number" && result.confidence.amount >= 0.55) {
        next.amount = result.amount;
        markAutoSource("amount", "auto-high");
      } else if (!canAutoReplace("amount") && typeof result.amount === "number") {
        keptUserInput = true;
      }
      const vendorSuggestion = result.vendor ? findVendorSuggestion(result.vendor, vendorSuggestions) : null;
      const vendorName = pickVendorName(result.vendor);
      if (canAutoReplace("vendorName") && vendorName && (result.confidence.vendor >= 0.5 || Boolean(vendorSuggestion))) {
        next.vendorName = vendorName;
        markAutoSource("vendorName", "auto-high");
      } else if (!canAutoReplace("vendorName") && result.vendor) {
        keptUserInput = true;
      }
      if (canAutoReplace("paymentMethod") && result.paymentMethod) {
        if (/現金/.test(result.paymentMethod)) next.paymentMethod = "cash";
        if (/クレジット|カード/.test(result.paymentMethod)) next.paymentMethod = "credit";
        if (/電子|Pay|IC|交通系/.test(result.paymentMethod)) next.paymentMethod = "e_money";
        if (/振込|銀行/.test(result.paymentMethod)) next.paymentMethod = "bank";
        markAutoSource("paymentMethod", "auto-high");
      } else if (!canAutoReplace("paymentMethod") && result.paymentMethod) {
        keptUserInput = true;
      }
      if (canAutoReplace("categoryName") && canAutoReplace("categoryId") && (!isUsefulCategoryName(prev.categoryName) || fieldSourcesRef.current.categoryName !== "user-edited")) {
        if (category) {
          next.categoryId = category.id;
          next.categoryName = category.name;
          markAutoSource("categoryId", "auto-high");
          markAutoSource("categoryName", "auto-high");
        } else if (mappedCategoryName) {
          next.categoryName = mappedCategoryName;
          markAutoSource("categoryName", "auto-high");
        }
      } else if ((!canAutoReplace("categoryName") || !canAutoReplace("categoryId")) && result.categorySuggestion) {
        keptUserInput = true;
      }
      next.ocrExtracted = {
        ...prev.ocrExtracted,
        date: next.transactionDate || prev.ocrExtracted?.date,
        amount: Number(next.amount) || prev.ocrExtracted?.amount,
        vendorName: next.vendorName || prev.ocrExtracted?.vendorName,
        dateConfidence: Math.max(prev.ocrExtracted?.dateConfidence || 0, result.confidence.date),
        amountConfidence: Math.max(prev.ocrExtracted?.amountConfidence || 0, result.confidence.amount),
        vendorConfidence: Math.max(prev.ocrExtracted?.vendorConfidence || 0, result.confidence.vendor),
        vendorNameCandidates: [
          ...(result.vendor ? [result.vendor] : []),
          ...(prev.ocrExtracted?.vendorNameCandidates || []),
        ].filter((value, index, all) => value && all.indexOf(value) === index).slice(0, 4),
      };
      const memoParts = [
        result.time ? `時刻: ${result.time}` : "",
        result.address ? `住所: ${result.address}` : "",
        result.phone ? `電話: ${result.phone}` : "",
        result.items.length ? `明細: ${result.items.map((item) => [item.name, item.quantity, item.unitPrice ? `${item.unitPrice}円` : "", item.amount ? `${item.amount}円` : ""].filter(Boolean).join(" ")).join(" / ")}` : "",
      ].filter(Boolean);
      if (canAutoReplace("memo") && !prev.memo && memoParts.length) {
        next.memo = memoParts.join("\n");
        markAutoSource("memo", "auto-high");
      } else if (!canAutoReplace("memo") && memoParts.length) {
        keptUserInput = true;
      }
      return next;
    });
    setScanState(result.date && result.amount && result.vendor ? "filled" : "partial");
    setHighAccuracyMessage(keptUserInput ? "読み取れたところだけ入力しました。入力済みのところはそのままです。" : "読み取れたところだけ入力しました。内容を確認して保存してください。");
  }

  function getFriendlyReadMessage(message?: string) {
    if (!message) return "うまく読み取れませんでした。手入力できます。";
    if (message.includes("ログイン")) return "通常の入力はこのまま使えます。";
    if (message.includes("今日")) return "今日の無料読み取りを使い切りました。手入力できます。";
    if (message.includes("使えません")) return "うまく読み取れませんでした。手入力できます。";
    return message;
  }

  function getReadLimitState(response: { reason?: string; rewardAdAvailable?: boolean; rewardBonusReads?: number; rewardAdWatchedCount?: number; rewardAdDailyLimit?: number }) {
    if (response.reason !== "daily_limit") return null;
    return {
      rewardAdAvailable: Boolean(response.rewardAdAvailable),
      rewardBonusReads: response.rewardBonusReads || 3,
      rewardAdWatchedCount: response.rewardAdWatchedCount || 0,
      rewardAdDailyLimit: response.rewardAdDailyLimit || 3,
    };
  }

  async function runHighAccuracyRead(file: File) {
    const cacheKey = getFileCacheKey(file);
    if (highAccuracyCacheRef.current?.key === cacheKey) {
      applyHighAccuracyResult(highAccuracyCacheRef.current.result);
      return { ok: true };
    }

    const currentUser = await waitForCurrentUser();
    const token = await currentUser?.getIdToken();
    if (!token) {
      return {
        ok: false,
        message: "通常の入力はこのまま使えます。",
      };
    }

    const response = await extractReceiptDataHighAccuracy(file, token);
    if (response.available && response.result) {
      if (!isHighAccuracyResultUseful(response.result)) {
        return { ok: false, message: "うまく読み取れませんでした。手入力できます。" };
      }
      setReadLimitState(null);
      highAccuracyCacheRef.current = { key: cacheKey, result: response.result };
      applyHighAccuracyResult(response.result);
      return { ok: true };
    }

    const limitState = getReadLimitState(response);
    if (limitState) setReadLimitState(limitState);
    return { ok: false, message: getFriendlyReadMessage(response.message), limitState };
  }

  async function fillFromPhoto(file: File) {
    setScanLoading(true);
    setScanState("reading");
    setHighAccuracyMessage("");
    setReadLimitState(null);
    try {
      const highAccuracyResult = await runHighAccuracyRead(file);
      if (highAccuracyResult.ok) {
        return;
      }

      const basicOk = await runBasicReceiptRead(file);
      if (basicOk) {
        if (highAccuracyResult.message?.includes("今日")) {
          setHighAccuracyMessage(highAccuracyResult.message);
        } else if (highAccuracyResult.message) {
          setHighAccuracyMessage("かんたん読み取りで入力しています。");
        }
        return;
      }

      setHighAccuracyMessage(highAccuracyResult.message || "うまく読み取れませんでした。手入力できます。");
      setScanState("failed");
    } finally {
      setScanLoading(false);
    }
  }

  async function handleHighAccuracyRead() {
    const file = files[0];
    if (!file || highAccuracyLoading || scanLoading) return;
    setHighAccuracyLoading(true);
    setHighAccuracyMessage("");
    setReadLimitState(null);
    try {
      const result = await runHighAccuracyRead(file);
      if (!result.ok) {
        setHighAccuracyMessage(result.message || "うまく読み取れませんでした。手入力できます。");
      }
    } finally {
      setHighAccuracyLoading(false);
    }
  }

  async function handleRewardAdRead() {
    const rewardAd = (window as RewardAdWindow).keihiPocketRewardAds;
    if (!rewardAd?.show || highAccuracyLoading || scanLoading) return;
    setHighAccuracyLoading(true);
    setHighAccuracyMessage("");
    try {
      const watched = await rewardAd.show();
      if (!watched) {
        setHighAccuracyMessage("手入力もできます。");
        return;
      }

      const currentUser = await waitForCurrentUser();
      const token = await currentUser?.getIdToken();
      if (!token) {
        setHighAccuracyMessage("通常の入力はこのまま使えます。");
        return;
      }

      const response = await fetch("/api/receipt/reward-ad", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as {
        available?: boolean;
        rewardBonusRemaining?: number;
        rewardBonusReads?: number;
        rewardAdWatchedCount?: number;
        rewardAdDailyLimit?: number;
        message?: string;
      };
      if (!response.ok || !data.available) {
        setHighAccuracyMessage(data.message || "手入力もできます。");
        return;
      }

      setReadLimitState((prev) =>
        prev
          ? {
              ...prev,
              rewardBonusReads: data.rewardBonusReads || prev.rewardBonusReads,
              rewardAdWatchedCount: data.rewardAdWatchedCount || prev.rewardAdWatchedCount,
              rewardAdDailyLimit: data.rewardAdDailyLimit || prev.rewardAdDailyLimit,
            }
          : null
      );
      setHighAccuracyLoading(false);
      await handleHighAccuracyRead();
    } catch (error) {
      console.warn("reward read failed", error);
      setHighAccuracyMessage("手入力もできます。");
    } finally {
      setHighAccuracyLoading(false);
    }
  }

  async function handleFiles(incoming: FileList | null) {
    if (!incoming?.length) return;
    const nextFiles = Array.from(incoming);
    setStarted(true);
    setFiles((prev) => [...prev, ...nextFiles]);
    await fillFromPhoto(nextFiles[0]);
  }

  async function handleFirstCamera(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    beginMode("camera");
    setFiles([file]);
    await fillFromPhoto(file);
  }

  async function handleFirstUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    beginMode("upload");
    setFiles([file]);
    await fillFromPhoto(file);
  }

  async function handleSave() {
    setLoading(true);
    setErrors([]);

    try {
      let valuesToSave = values;
      if (values.categoryId?.startsWith("default-")) {
        const fallbackCategory = getDefaultCategoryById(values.categoryId);
        if (fallbackCategory) {
          const category = { ...fallbackCategory, userId };
          valuesToSave = {
            ...values,
            categoryId: category.id,
            categoryName: category.name,
          };
          try {
            await saveCategory(category);
          } catch (categoryError) {
            console.warn("category fallback save failed", categoryError);
          }
        }
      }

      const parsed = recordSchema.safeParse(valuesToSave);
      if (!parsed.success) {
        setErrors(parsed.error.issues.map((issue) => issue.message));
        return;
      }

      const id = await saveRecord({
        ...valuesToSave,
        id: initial?.id,
        userId,
        fiscalYearStartMonth,
      });

      if (isUsableVendorName(valuesToSave.vendorName)) {
        try {
          await saveVendorSuggestion(userId, valuesToSave.vendorName);
        } catch (vendorError) {
          console.warn("vendor suggestion save failed", vendorError);
        }
      }

      if (files.length > 0) {
        try {
          const imageUrls = await uploadRecordImages({ userId, recordId: id, files });
          if (imageUrls.length > 0) {
            await saveRecord({
              ...valuesToSave,
              id,
              userId,
              createdAt: valuesToSave.createdAt || new Date().toISOString(),
              imageUrls: [...valuesToSave.imageUrls, ...imageUrls],
              thumbnailUrl: valuesToSave.thumbnailUrl || imageUrls[0] || null,
              fiscalYearStartMonth,
            });
          }
        } catch (error) {
          console.error("record image save failed", error);
        }
      }

      router.push(`/records/${id}`);
    } catch (error) {
      if (isDemoStorageQuotaError(error)) {
        setErrors(["保存できる量を超えました。古いお試しデータを整理してから、もう一度お試しください。"]);
        return;
      }

      console.error("record save failed", error);
      setErrors(["保存できませんでした。通信状況を確認して、もう一度お試しください。"]);
    } finally {
      setLoading(false);
    }
  }

  const requiredChecks = [
    { label: "日付", ready: Boolean(values.transactionDate) },
    { label: "金額", ready: Number(values.amount) > 0 },
    { label: values.recordType === "income" ? "入金元" : "お店・相手先", ready: Boolean(values.vendorName) },
  ];
  const readyChecks = requiredChecks.filter((item) => item.ready);
  const hasPhotoPreview = previews.length > 0;
  const isPhotoEntry = entryMode === "camera" || entryMode === "upload";
  const canUseRewardAd = Boolean(readLimitState?.rewardAdAvailable) && rewardAdReady;
  const shouldOfferRetryRead =
    isPhotoEntry &&
    files.length > 0 &&
    !scanLoading &&
    (scanState === "partial" || scanState === "failed" || Boolean(readLimitState));
  const showReadHelp =
    Boolean(readLimitState) ||
    shouldOfferRetryRead ||
    Boolean(highAccuracyMessage && scanState !== "filled");

  const topStatus = useMemo(() => {
    if (scanLoading || scanState === "reading") {
      return {
        tone: "active",
        title: "読み取り中",
        subtitle: "",
      };
    }
    if (scanState === "filled") {
      return {
        tone: "done",
        title: "読み取れたところを入力しました",
        subtitle: "内容を確認して保存してください。",
      };
    }
    if (scanState === "failed") {
      return {
        tone: "plain",
        title: "手入力できます",
        subtitle: "内容を確認して保存してください。",
      };
    }
    if (scanState === "partial" && isPhotoEntry && hasPhotoPreview) {
      return {
        tone: "plain",
        title: "読み取れた内容を確認してください",
        subtitle: "",
      };
    }
    return null;
  }, [hasPhotoPreview, isPhotoEntry, scanLoading, scanState]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.info("record form categories loaded", {
        categoriesCount: categories.length,
        recordType: values.recordType,
        categoriesLoading,
      });
    }
  }, [categories, categoriesLoading, values.recordType]);

  return (
    <div className="section">
      {!started ? (
        <section className="capture-start">
          <div className="capture-copy">
            <h2>登録方法を選ぶ</h2>
            <p>まずは写真で登録するか、手入力するかを選べます。</p>
          </div>

          {!selectingPhotoMode ? (
            <>
              <button type="button" className="action-card-button action-card-primary capture-choice-main" onClick={() => setSelectingPhotoMode(true)}>
                <span className="action-card-icon">
                  <Camera size={22} />
                </span>
                <div>
                  <strong>写真で登録</strong>
                  <p>レシートを撮るか、写真を選んで始めます。</p>
                </div>
              </button>

              <div className="sub-actions">
                <button type="button" onClick={() => beginMode("manual")}>
                  <Keyboard size={18} />
                  手入力
                </button>
                <button type="button" onClick={() => beginMode("income")}>
                  <WalletCards size={18} />
                  売上を登録
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="capture-button capture-button-main">
                <Camera size={30} />
                <span>レシートを撮る</span>
                <small>そのまま内容の確認に進めます</small>
                <input hidden type="file" accept="image/*" capture="environment" onChange={handleFirstCamera} />
              </label>
              <div className="sub-actions">
                <label className="sub-action-file">
                  <ImagePlus size={18} />
                  写真を選ぶ
                  <input hidden type="file" accept="image/*" onChange={handleFirstUpload} />
                </label>
                <button type="button" onClick={() => setSelectingPhotoMode(false)}>
                  <Keyboard size={18} />
                  戻る
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {started ? (
        <>
          {topStatus ? (
            <Card className={`list-card reading-status-card ${topStatus.tone}`}>
              <div className="reading-status-row">
                <span className="reading-status-icon" aria-hidden="true">
                  {topStatus.tone === "active" ? <LoaderCircle size={20} /> : <CheckCircle2 size={20} />}
                </span>
                <div>
                  <strong>{topStatus.title}</strong>
                  <p className="subtitle" style={{ margin: "4px 0 0" }}>
                    {topStatus.subtitle}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <RecordTypeTabs value={values.recordType} onChange={(next) => updateValue("recordType", next)} />

          {entryMode !== "manual" && entryMode !== "income" ? (
            <ImageUploader
              mode={entryMode}
              previews={previews}
              onChange={handleFiles}
              onRemove={(index) => {
                if (index < values.imageUrls.length) {
                  updateValue("imageUrls", values.imageUrls.filter((_: string, i: number) => i !== index));
                  return;
                }
                const fileIndex = index - values.imageUrls.length;
                setFiles((prev) => prev.filter((_, i) => i !== fileIndex));
              }}
            />
          ) : null}

          <Card className="list-card">
            <div className="heading">
              <div>
                <h3>{values.recordType === "income" ? "登録する内容" : "確認する内容"}</h3>
                <p className="subtitle">{readyChecks.length}/3 入力済み</p>
              </div>
              {values.amount > 0 || values.vendorName ? <CheckCircle2 className="success-icon" size={24} /> : null}
            </div>
            {readyChecks.length > 0 ? (
              <div className="readiness-list">
                {readyChecks.map((item) => (
                  <span key={item.label} className="readiness-pill ready">
                    入力済み・{item.label}
                  </span>
                ))}
              </div>
            ) : null}
            {showReadHelp ? (
              <div className="inline-high-accuracy">
                <div>
                  <strong>{readLimitState ? "今日の無料読み取りを使い切りました" : "店名や金額をもう一度読み取る"}</strong>
                  <p className="subtitle">
                    {readLimitState
                      ? canUseRewardAd
                        ? `動画を見ると、あと${readLimitState.rewardBonusReads}件読み取れます。手入力もできます。`
                        : "手入力もできます。広告なしで使うこともできます。"
                      : highAccuracyMessage || "うまく入らない時に使えます。内容を確認して保存してください。"}
                  </p>
                </div>
                {readLimitState ? (
                  <div className="wrap">
                    {canUseRewardAd ? (
                      <Button type="button" variant="secondary" disabled={highAccuracyLoading || scanLoading} onClick={handleRewardAdRead}>
                        {highAccuracyLoading ? "読み取り中..." : "動画を見て読み取る"}
                      </Button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={() => beginMode("manual")}>
                      手入力する
                    </Button>
                    <Link href="/settings#plus-plan">
                      <Button type="button" variant="secondary">
                        広告なしで使う
                      </Button>
                    </Link>
                  </div>
                ) : shouldOfferRetryRead ? (
                  <Button type="button" variant="secondary" disabled={highAccuracyLoading || scanLoading} onClick={handleHighAccuracyRead}>
                    {highAccuracyLoading ? "読み取り中..." : "もう一度読み取る"}
                  </Button>
                ) : null}
              </div>
            ) : null}
            <RecordBasicFields
              values={values}
              categories={categories}
              vendorSuggestions={vendorSuggestions}
              categoriesLoading={categoriesLoading}
              onChange={updateValue}
            />
          </Card>

          <RecordAdvancedFields values={values} onChange={updateValue} />

          <div className="sticky-actions">
            <div className="row save-row">
              <Button disabled={loading || scanLoading} onClick={handleSave}>
                {scanLoading ? "読み取り中..." : loading ? "保存しています..." : "この内容で保存"}
              </Button>
              <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                ホームへ戻る
              </Button>
            </div>
          </div>

          {!scanLoading && entryMode !== "manual" && entryMode !== "income" ? (
            <OcrCandidatePanel
              loading={false}
              extracted={values.ocrExtracted}
              onApply={(field, value) => {
                if (value === undefined) return;
                if (field === "date") updateValue("transactionDate", String(value));
                if (field === "amount") updateValue("amount", Number(value));
                if (field === "vendorName") updateValue("vendorName", String(value));
              }}
            />
          ) : null}

          {SHOW_RECEIPT_DEBUG ? (
            <details className="card debug-panel">
              <summary>読み取り内容</summary>
              <div className="debug-grid">
                <div>
                  <strong>方式</strong>
                  <pre>{values.ocrExtracted?.provider || "なし"}</pre>
                </div>
                <div>
                  <strong>読み取り文字</strong>
                  <pre>{values.ocrRawText ? values.ocrRawText.slice(0, 600) : "なし"}</pre>
                </div>
                <div>
                  <strong>抽出候補</strong>
                  <pre>
                    {JSON.stringify(
                      {
                        date: values.ocrExtracted?.date,
                        amount: values.ocrExtracted?.amount,
                        vendorName: values.ocrExtracted?.vendorName,
                        dateCandidates: values.ocrExtracted?.dateCandidates || [],
                        amountCandidates: values.ocrExtracted?.amountCandidates || [],
                        vendorNameCandidates: values.ocrExtracted?.vendorNameCandidates || [],
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div>
                  <strong>除外理由</strong>
                  <pre>{JSON.stringify(values.ocrExtracted?.debug?.rejected || [], null, 2)}</pre>
                </div>
              </div>
            </details>
          ) : null}

          {errors.length > 0 ? (
            <Card className="list-card error-card">
              {errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
