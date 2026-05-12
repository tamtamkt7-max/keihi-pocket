import { NextRequest, NextResponse } from "next/server";
import { AmountCandidate, OcrExtracted } from "@/types/record";
import {
  analyzeReceiptBufferWithGoogleVision,
  getGoogleVisionAuthStatus,
  googleVisionConfigured,
  VisionReceiptAnalysis,
} from "@/lib/vision/googleVision";
import { prepareReceiptImageVariants } from "@/lib/vision/preprocessReceiptImage";

export const runtime = "nodejs";

const LOG_PREFIX = "[receipt-analyze]";

function logInfo(message: string, details?: Record<string, unknown>) {
  console.log(LOG_PREFIX, message, details || "");
}

function logWarn(message: string, details?: Record<string, unknown>) {
  console.warn(LOG_PREFIX, message, details || "");
}

function mergeUnique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function nonsenseRatio(text: string) {
  if (!text.trim()) return 1;
  const weirdMatches = text.match(/[^\w\s\u3040-\u30ff\u3400-\u9fff.,:/%￥¥()\-&'"!?#]/g) || [];
  return weirdMatches.length / Math.max(text.length, 1);
}

function scoreVariant(result: VisionReceiptAnalysis) {
  const amountCandidates = result.extracted.amountCandidates?.filter((candidate) => !candidate.excludedReason) || [];
  const hasAmount = typeof result.extracted.amount === "number" && result.extracted.amount > 0;
  const hasVendor = Boolean(result.extracted.vendorName);
  const hasDate = Boolean(result.extracted.date);
  const textLengthScore = Math.min(result.rawText.trim().length / 900, 1.2);
  const lineScore = Math.min(result.lines.length / 45, 1);
  const weirdPenalty = nonsenseRatio(result.rawText) * 1.4;
  const confidenceScore =
    (result.extracted.amountConfidence || 0) * 1.1 +
    (result.extracted.vendorConfidence || 0) * 0.9 +
    (result.extracted.dateConfidence || 0) * 0.7;

  let score = 0;
  score += textLengthScore;
  score += lineScore * 0.7;
  score += confidenceScore;
  score += hasAmount ? 2.2 : 0;
  score += hasVendor ? 1.6 : 0;
  score += hasDate ? 1.1 : 0;
  score += amountCandidates.length ? Math.min(amountCandidates.length, 4) * 0.15 : 0;
  score -= weirdPenalty;

  if (result.variant === "original") score += 0.08;
  if (result.variant === "enhanced") score += 0.06;
  if (result.variant === "center-focus") score += 0.04;
  if (/rotate/.test(result.variant) && hasAmount && hasVendor) score += 0.1;

  return Number(score.toFixed(3));
}

function pickBestResult(results: VisionReceiptAnalysis[]) {
  return [...results].sort((a, b) => {
    const scoreDiff = scoreVariant(b) - scoreVariant(a);
    if (scoreDiff !== 0) return scoreDiff;
    const textDiff = b.rawText.length - a.rawText.length;
    if (textDiff !== 0) return textDiff;
    return a.variant.localeCompare(b.variant);
  })[0];
}

function mergeVisionResults(results: VisionReceiptAnalysis[]) {
  const selected = pickBestResult(results);
  const bestDate = results
    .filter((result) => result.extracted.date && typeof result.extracted.dateConfidence === "number")
    .sort((a, b) => (b.extracted.dateConfidence || 0) - (a.extracted.dateConfidence || 0))[0];

  const bestAmount = results
    .filter((result) => typeof result.extracted.amount === "number" && typeof result.extracted.amountConfidence === "number")
    .sort((a, b) => (b.extracted.amountConfidence || 0) - (a.extracted.amountConfidence || 0))[0];

  const bestVendor = results
    .filter((result) => result.extracted.vendorName && typeof result.extracted.vendorConfidence === "number")
    .sort((a, b) => (b.extracted.vendorConfidence || 0) - (a.extracted.vendorConfidence || 0))[0];

  const extracted: OcrExtracted = {
    date: selected.extracted.date || bestDate?.extracted.date,
    amount: typeof selected.extracted.amount === "number" ? selected.extracted.amount : bestAmount?.extracted.amount,
    vendorName: selected.extracted.vendorName || bestVendor?.extracted.vendorName,
    dateConfidence: selected.extracted.dateConfidence ?? bestDate?.extracted.dateConfidence,
    amountConfidence: selected.extracted.amountConfidence ?? bestAmount?.extracted.amountConfidence,
    vendorConfidence: selected.extracted.vendorConfidence ?? bestVendor?.extracted.vendorConfidence,
    dateCandidates: mergeUnique(
      results.flatMap((result) => [
        ...(result.extracted.date ? [result.extracted.date] : []),
        ...(result.extracted.dateCandidates || []),
      ])
    ).filter((value) => value !== (selected.extracted.date || bestDate?.extracted.date)).slice(0, 4),
    amountCandidates: results
      .flatMap((result) => [
        ...(typeof result.extracted.amount === "number"
          ? [{
              value: result.extracted.amount,
              sourceLine: "",
              nearbyLabel: "",
              score: result.extracted.amountConfidence || 0,
              reason: `${result.variant}:selected`,
              selectedReason: result.variant === selected.variant ? "selected-variant" : "selected-in-variant",
            }]
          : []),
        ...(result.extracted.amountCandidates || []).map((candidate) =>
          typeof candidate === "number"
            ? {
                value: candidate,
                sourceLine: "",
                nearbyLabel: "",
                score: 0,
                reason: `${result.variant}:candidate`,
              }
            : {
                ...candidate,
                reason: `${result.variant}:${candidate.reason}`,
              }
        ),
      ])
      .filter((candidate, index, all) =>
        candidate.value !== (typeof selected.extracted.amount === "number" ? selected.extracted.amount : bestAmount?.extracted.amount) &&
        all.findIndex((item) => item.value === candidate.value && item.reason === candidate.reason) === index
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10),
    vendorNameCandidates: mergeUnique(
      results.flatMap((result) => [
        ...(result.extracted.vendorName ? [result.extracted.vendorName] : []),
        ...(result.extracted.vendorNameCandidates || []),
      ])
    ).filter((value) => value !== (selected.extracted.vendorName || bestVendor?.extracted.vendorName)).slice(0, 4),
    provider: "vision",
    debug: {
      accepted: results.flatMap((result) =>
        (result.extracted.debug?.accepted || []).map((item) => ({
          ...item,
          reason: `${result.variant}:${item.reason}`,
        }))
      ),
      rejected: results.flatMap((result) =>
        (result.extracted.debug?.rejected || []).map((item) => ({
          ...item,
          reason: `${result.variant}:${item.reason}`,
        }))
      ),
    },
  };

  const rawText = selected.rawText;

  return { rawText, extracted, selectedVariant: selected.variant };
}

export async function POST(request: NextRequest) {
  try {
    const authStatus = getGoogleVisionAuthStatus();
    logInfo("vision config checked", authStatus);

    if (!googleVisionConfigured()) {
      logWarn("fallback used", { reason: "GOOGLE_CLOUD_VISION_API_KEY is not set and service account config is incomplete" });
      return NextResponse.json({ message: "Vision not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      logWarn("fallback used", { reason: "missing image file in form data" });
      return NextResponse.json({ message: "Image file is required" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let originalBase64Length = 0;
    try {
      originalBase64Length = inputBuffer.toString("base64").length;
      logInfo("image received", {
        fileName: file.name,
        fileSize: file.size,
        bufferSize: inputBuffer.length,
        mimeType: file.type || "unknown",
        base64Length: originalBase64Length,
        base64Converted: originalBase64Length > 0,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "base64 conversion failed";
      logWarn("fallback used", { reason, fileSize: file.size, mimeType: file.type || "unknown" });
      return NextResponse.json({ message: reason }, { status: 400 });
    }

    let variants;
    try {
      variants = await prepareReceiptImageVariants(inputBuffer);
      logInfo("image variants prepared", {
        variants: variants.map((variant) => ({
          name: variant.name,
          width: variant.width,
          height: variant.height,
          size: variant.buffer.length,
          base64Length: variant.buffer.toString("base64").length,
        })),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "image preprocessing failed";
      logWarn("fallback used", { reason, fileSize: file.size, mimeType: file.type || "unknown" });
      return NextResponse.json({ message: reason }, { status: 415 });
    }

    const results = (
      await Promise.all(
        variants.map(async (variant) => {
          try {
            const result = await analyzeReceiptBufferWithGoogleVision(variant.buffer, variant.name);
            if (!result) {
              logWarn("vision api failed", { variant: variant.name, reason: "no analysis result" });
              return null;
            }
            logInfo("vision api success", {
              variant: variant.name,
              rawTextLength: result.rawText.length,
              lineCount: result.lines.length,
              amount: result.extracted.amount,
              vendorName: result.extracted.vendorName,
              date: result.extracted.date,
            });
            if (!result.rawText.trim()) {
              logWarn("vision api failed", { variant: variant.name, reason: "rawText is empty" });
            }
            return result;
          } catch (error) {
            const reason = error instanceof Error ? error.message : "unknown vision error";
            logWarn("vision api failed", { variant: variant.name, reason });
            return null;
          }
        })
      )
    ).filter((result): result is VisionReceiptAnalysis => Boolean(result));

    if (results.length === 0) {
      logWarn("fallback used", { reason: "all vision variants failed" });
      return NextResponse.json({ message: "Vision analysis failed" }, { status: 502 });
    }

    const merged = mergeVisionResults(results);
    const variantSummary = results.map((result) => ({
      variant: result.variant,
      score: scoreVariant(result),
      rawTextLength: result.rawText.length,
      amount: result.extracted.amount ?? null,
      vendorName: result.extracted.vendorName || null,
      date: result.extracted.date || null,
    }));
    logInfo("vision analysis merged", {
      selectedVariant: merged.selectedVariant,
      rawTextLength: merged.rawText.length,
      amount: merged.extracted.amount,
      vendorName: merged.extracted.vendorName,
      date: merged.extracted.date,
      amountCandidates: merged.extracted.amountCandidates?.length || 0,
      topAmountCandidates: (merged.extracted.amountCandidates || []).slice(0, 5),
      vendorNameCandidates: merged.extracted.vendorNameCandidates?.length || 0,
      dateCandidates: merged.extracted.dateCandidates?.length || 0,
      variants: variantSummary,
    });

    if (!merged.rawText.trim()) {
      logWarn("vision api failed", { reason: "merged rawText is empty" });
    } else if (!merged.extracted.amount || !merged.extracted.vendorName) {
      logWarn("vision api success but extraction incomplete", {
        rawTextLength: merged.rawText.length,
        hasAmount: Boolean(merged.extracted.amount),
        hasVendorName: Boolean(merged.extracted.vendorName),
      });
    }

    return NextResponse.json({
      rawText: merged.rawText,
      extracted: merged.extracted,
      provider: "vision",
      debug:
        process.env.SHOW_RECEIPT_DEBUG === "1"
          ? {
              variants: results.map((result) => ({
                variant: result.variant,
                score: scoreVariant(result),
                lines: result.lines,
                extracted: result.extracted,
              })),
              selectedVariant: merged.selectedVariant,
            }
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Vision error";
    logWarn("vision api failed", { reason: message });
    logWarn("fallback used", { reason: message });
    return NextResponse.json({ message }, { status: 502 });
  }
}
