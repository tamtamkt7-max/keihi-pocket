"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, ImagePlus, Keyboard, WalletCards } from "lucide-react";
import { Category } from "@/types/category";
import { RecordItem } from "@/types/record";
import { consumePendingReceiptCapture } from "@/lib/capture/pendingReceiptCapture";
import { recordSchema } from "@/lib/validations/recordSchema";
import { saveRecord } from "@/lib/firestore/records";
import { uploadRecordImages } from "@/lib/storage/uploadRecordImages";
import { extractReceiptData } from "@/lib/ocr/extractReceiptData";
import { isDemoStorageQuotaError } from "@/lib/mock/localDb";
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
  initial,
  defaultType = "expense",
  initialEntryMode = "camera",
}: Props) {
  const router = useRouter();
  const consumedPending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [entryMode, setEntryMode] = useState<EntryMode>(
    initial ? (initial.recordType === "income" ? "income" : "manual") : initialEntryMode
  );
  const [started, setStarted] = useState(Boolean(initial) || initialEntryMode !== "camera");
  const [values, setValues] = useState({
    recordType: initial?.recordType || (initialEntryMode === "income" ? "income" : defaultType),
    documentType: initial?.documentType || "receipt",
    transactionDate: initial?.transactionDate || new Date().toISOString().slice(0, 10),
    amount: initial?.amount || 0,
    vendorName: initial?.vendorName || "",
    categoryId: initial?.categoryId || null,
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
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function beginMode(mode: EntryMode) {
    setStarted(true);
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
    try {
      const result = await extractReceiptData(file);
      setValues((prev) => ({
        ...prev,
        ocrRawText: result.rawText,
        ocrExtracted: result.extracted,
        transactionDate: result.extracted.date || "",
        amount: result.extracted.amount ?? 0,
        vendorName: result.extracted.vendorName || "",
      }));
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

  async function handleSave() {
    setLoading(true);
    setErrors([]);

    try {
      const parsed = recordSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(parsed.error.issues.map((issue) => issue.message));
        return;
      }

      const id = await saveRecord({
        ...values,
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
              ...values,
              id,
              userId,
              createdAt: values.createdAt || new Date().toISOString(),
              imageUrls: [...values.imageUrls, ...imageUrls],
              thumbnailUrl: values.thumbnailUrl || imageUrls[0] || null,
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

  return (
    <div className="section">
      {!started ? (
        <section className="capture-start">
          <label className="capture-button capture-button-main">
            <Camera size={30} />
            <span>撮る</span>
            <small>レシートや書類を撮って登録できます</small>
            <input hidden type="file" accept="image/*" capture="environment" onChange={handleFirstCamera} />
          </label>
          <div className="sub-actions">
            <button type="button" onClick={() => beginMode("upload")}>
              <ImagePlus size={18} />
              写真から
            </button>
            <button type="button" onClick={() => beginMode("manual")}>
              <Keyboard size={18} />
              手入力
            </button>
            <button type="button" onClick={() => beginMode("income")}>
              <WalletCards size={18} />
              売上
            </button>
          </div>
        </section>
      ) : null}

      {started ? (
        <>
          <Card className="list-card entry-mode-card">
            <div className="heading" style={{ marginBottom: 0 }}>
              <div>
                <h3>{entryMode === "income" ? "売上を登録" : "内容を確認"}</h3>
                <p className="subtitle">
                  {scanLoading ? "写真を確認中..." : "足りないところだけ直して、そのまま保存できます。"}
                </p>
              </div>
              {!initial ? (
                <Button variant="ghost" onClick={() => setStarted(false)}>
                  戻る
                </Button>
              ) : null}
            </div>
          </Card>

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
                  あとから見直したいときは、保存後にも直せます。
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
                  {item.ready ? "入力済み" : "未入力"}・{item.label}
                </span>
              ))}
            </div>
            <RecordBasicFields values={values} categories={categories} onChange={updateValue} />
          </Card>

          <RecordAdvancedFields values={values} onChange={updateValue} />

          <div className="sticky-actions">
            <div className="row save-row">
              <Button disabled={loading || scanLoading} onClick={handleSave}>
                {scanLoading ? "確認中..." : loading ? "保存中..." : "この内容で保存"}
              </Button>
              <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                やめる
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
              <summary>開発用の確認</summary>
              <div className="debug-grid">
                <div>
                  <strong>方式</strong>
                  <pre>{values.ocrExtracted?.provider || "未取得"}</pre>
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
