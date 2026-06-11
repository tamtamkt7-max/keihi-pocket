"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, ImagePlus, Keyboard, LoaderCircle, WalletCards } from "lucide-react";
import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { consumePendingReceiptCapture } from "@/lib/capture/pendingReceiptCapture";
import { recordSchema } from "@/lib/validations/recordSchema";
import { saveRecord } from "@/lib/firestore/records";
import { saveCategory } from "@/lib/firestore/categories";
import { uploadRecordImages } from "@/lib/storage/uploadRecordImages";
import { extractReceiptData } from "@/lib/ocr/extractReceiptData";
import { isDemoStorageQuotaError } from "@/lib/mock/localDb";
import { getDefaultCategoryById } from "@/lib/categories/defaultCategories";
import { ImageUploader } from "./ImageUploader";
import { OcrCandidatePanel } from "./OcrCandidatePanel";
import { RecordTypeTabs } from "./RecordTypeTabs";
import { RecordBasicFields } from "./RecordBasicFields";
import { RecordAdvancedFields } from "./RecordAdvancedFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type EntryMode = "camera" | "upload" | "manual" | "income";

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
  const touchedFields = useRef(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "reading" | "filled" | "partial" | "failed">("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [entryMode, setEntryMode] = useState<EntryMode>(
    initial ? (initial.recordType === "income" ? "income" : "manual") : initialEntryMode
  );
  const [started, setStarted] = useState(Boolean(initial) || initialEntryMode !== "camera");
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

  useEffect(() => {
    if (initial || consumedPending.current) return;
    consumedPending.current = true;
    (async () => {
      const pending = await consumePendingReceiptCapture();
      if (!pending) return;
      setStarted(true);
      setEntryMode("camera");
      setFiles([pending]);
      await fillFromPhoto(pending);
    })();
  }, [initial]);

  function updateValue(key: string, value: any) {
    touchedFields.current.add(key);
    setValues((prev) => ({ ...prev, [key]: value }));
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

  async function fillFromPhoto(file: File) {
    setScanLoading(true);
    setScanState("reading");
    try {
      const result = await extractReceiptData(file);
      setValues((prev) => ({
        ...prev,
        ocrRawText: result.rawText,
        ocrExtracted: result.extracted,
        transactionDate: touchedFields.current.has("transactionDate")
          ? prev.transactionDate
          : result.extracted.date || prev.transactionDate,
        amount: touchedFields.current.has("amount")
          ? prev.amount
          : result.extracted.amount ?? prev.amount,
        vendorName: touchedFields.current.has("vendorName")
          ? prev.vendorName
          : result.extracted.vendorName || prev.vendorName,
      }));
      setScanState(result.extracted.date && result.extracted.amount && result.extracted.vendorName ? "filled" : "partial");
    } catch (error) {
      console.error("receipt read failed", error);
      setScanState("failed");
    } finally {
      setScanLoading(false);
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

      let detailQuery = "";

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
          } else {
            detailQuery = "?saved=details-only";
          }
        } catch (error) {
          console.error("record image save failed", error);
          detailQuery = "?saved=details-only";
        }
      }

      router.push(`/records/${id}${detailQuery}`);
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

  const needsManualHelp =
    !scanLoading &&
    entryMode !== "manual" &&
    entryMode !== "income" &&
    started &&
    (!values.transactionDate || !values.amount || !values.vendorName);

  const requiredChecks = [
    { label: "日付", ready: Boolean(values.transactionDate) },
    { label: "金額", ready: Number(values.amount) > 0 },
    { label: values.recordType === "income" ? "入金元" : "お店・相手先", ready: Boolean(values.vendorName) },
  ];
  const readyCount = requiredChecks.filter((item) => item.ready).length;
  const hasPhotoPreview = previews.length > 0;
  const isPhotoEntry = entryMode === "camera" || entryMode === "upload";

  const topStatus = useMemo(() => {
    if (scanLoading || scanState === "reading") {
      return {
        tone: "active",
        title: "レシートを読み取っています",
        subtitle: "分かったところから入力します。先に入力しても大丈夫です。",
      };
    }
    if (scanState === "filled") {
      return {
        tone: "done",
        title: "分かったところを入力しました",
        subtitle: "内容を確認して、必要なところだけ直してください。",
      };
    }
    if (scanState === "failed") {
      return {
        tone: "warning",
        title: "読み取れなかったところがあります",
        subtitle: "写真は追加されています。分かる範囲で入力してください。",
      };
    }
    if (scanState === "partial" || needsManualHelp) {
      return {
        tone: "warning",
        title: "足りないところだけ入力してください",
        subtitle: "読み取れなかった項目は手入力できます。",
      };
    }
    if (entryMode === "manual" || entryMode === "income") {
      return {
        tone: "plain",
        title: "足りないところだけ入力してください",
        subtitle: "入力した内容を保存すると、一覧と集計に反映されます。",
      };
    }
    if (isPhotoEntry && hasPhotoPreview) {
      return {
        tone: "plain",
        title: "内容を確認してください",
        subtitle: "必要なところだけ直して保存します。",
      };
    }
    return null;
  }, [entryMode, hasPhotoPreview, isPhotoEntry, needsManualHelp, scanLoading, scanState]);

  const entryHeading = useMemo(() => {
    if (entryMode === "income") {
      return {
        title: "売上を入力",
        subtitle: "入金日や金額を確認して保存します。",
      };
    }

    if (isPhotoEntry && !hasPhotoPreview && !scanLoading) {
      return {
        title: "写真を追加",
        subtitle: "レシートを撮るか、写真を選んでください。",
      };
    }

    return {
      title: "内容を確認",
      subtitle: scanLoading ? "写真を確認しています..." : "足りないところだけ直して保存します。",
    };
  }, [entryMode, hasPhotoPreview, isPhotoEntry, scanLoading]);

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
          <Card className="list-card entry-mode-card">
            <div className="heading" style={{ marginBottom: 0 }}>
              <div>
                <h3>{entryHeading.title}</h3>
                <p className="subtitle">{entryHeading.subtitle}</p>
              </div>
              {!initial ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStarted(false);
                    setSelectingPhotoMode(false);
                  }}
                >
                  戻る
                </Button>
              ) : null}
            </div>
          </Card>

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

          {scanLoading && entryMode !== "manual" && entryMode !== "income" ? (
            <OcrCandidatePanel
              loading={scanLoading}
              extracted={values.ocrExtracted}
              onApply={(field, value) => {
                if (value === undefined) return;
                if (field === "date") updateValue("transactionDate", String(value));
                if (field === "amount") updateValue("amount", Number(value));
                if (field === "vendorName") updateValue("vendorName", String(value));
              }}
            />
          ) : null}

          {needsManualHelp ? (
            <Card className="list-card soft-warning-card">
              <div>
                <strong>足りないところだけ入力してください</strong>
                <p className="subtitle" style={{ margin: "6px 0 0" }}>
                  保存後も編集できます。
                </p>
              </div>
            </Card>
          ) : null}

          <Card className="list-card">
            <div className="heading">
              <div>
                <h3>{values.recordType === "income" ? "登録する内容" : "確認する内容"}</h3>
                <p className="subtitle">{readyCount}/3 入力できています</p>
              </div>
              {values.amount > 0 || values.vendorName ? <CheckCircle2 className="success-icon" size={24} /> : null}
            </div>
            <div className="readiness-list">
              {requiredChecks.map((item) => (
                <span key={item.label} className={`readiness-pill ${item.ready ? "ready" : ""}`}>
                  {item.ready ? "入力済み" : "あと少し"}・{item.label}
                </span>
              ))}
            </div>
            <RecordBasicFields
              values={values}
              categories={categories}
              categoriesLoading={categoriesLoading}
              onChange={updateValue}
            />
          </Card>

          <RecordAdvancedFields values={values} onChange={updateValue} />

          <div className="sticky-actions">
            <div className="row save-row">
              <Button disabled={loading || scanLoading} onClick={handleSave}>
                {scanLoading ? "写真を確認しています..." : loading ? "保存しています..." : "この内容で保存"}
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
