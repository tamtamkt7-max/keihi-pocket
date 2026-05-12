import { AmountCandidate, OcrExtracted } from "@/types/record";

export type ReceiptLine = {
  text: string;
  y: number;
  x: number;
  confidence?: number;
};

export type ReceiptAnalysis = {
  rawText: string;
  lines: ReceiptLine[];
  extracted: OcrExtracted;
};

type Provider = "vision" | "fallback";
type CandidateField = "date" | "amount" | "vendorName";

type ScoredValue<T> = {
  value: T;
  confidence: number;
  reason: string;
  sourceLine?: string;
  nearbyLabel?: string;
  excludedReason?: string;
  selectedReason?: string;
};

type DebugItem = {
  field: CandidateField;
  value: string;
  confidence: number;
  reason: string;
};

const FINAL_TOTAL_WORDS = /(総合計|税込合計|合計金額|お買上げ?計|ご利用金額|領収金額|請求金額|お会計|現計|grand\s*total|total\s*(amount)?|amount\s*due|balance\s*due|balance|amount)/i;
const GENERIC_TOTAL_WORDS = /合計/i;
const PAYMENT_WORDS = /(お預り|預り|現金|支払|お支払い|クレジット|カード|電子マネー|交通系|QR|PayPay|釣銭|お釣り|返金|受取|付与ポイント|利用ポイント)/i;
const CHANGE_WORDS = /(釣銭|お釣り)/i;
const PAID_WORDS = /(お預り|預り|現金|支払|お支払い|クレジット|カード|電子マネー|交通系|QR|PayPay|受取)/i;
const DISCOUNT_WORDS = /(値引|割引|クーポン|割戻|返品|返金|ポイント値引|特典値引|マイナス|-\s*[¥￥]?\d)/i;
const SUBTOTAL_WORDS = /(小計|税抜小計|税込小計|商品計|内税|外税|消費税|税額|sub\s*total|subtotal|tax)/i;
const CARD_DETAIL_WORDS = /(承認番号|取引番号|カード番号|会員番号|端末番号|伝票番号|照会番号|登録番号|JAN|No\.?)/i;
const AMOUNT_EXCLUDE_WORDS = /(電話|tel|fax|〒|郵便|会員|カード番号|承認|取引|端末|レシート|伝票|No\.?|番号|登録番号|JAN|税率|内税|外税|消費税|小計|担当|時刻|日時|単価|数量|個数|点数|税額)/i;
const VENDOR_EXCLUDE_WORDS = /(領収書|レシート|請求書|納品書|登録番号|TEL|電話|FAX|住所|合計|小計|税|担当|レジ|No\.?|番号|日時|時刻|郵便|現金|クレジット|カード|伝票|内税|外税)/i;
const DATE_NEAR_WORDS = /(日付|日時|発行|利用|購入)/i;
const SEPARATOR_LINE = /^[-=ー―─━*＊・\s]{4,}$/;
const PRODUCT_LINE_WORDS = /(単価|数量|個|点|点数|品番|商品|部門|惣菜|食品|軽減|対象|@|×|x\s*\d|\d+\s*点)/i;
const SMALL_AMOUNT_CONTEXT_WORDS = /(数量|単価|皿|点|個|税|率|割引|値引|ポイント|番号|区分|枚|名|人数|小計|内税|外税|税額)/i;
const SUSHI_VENDOR_WORDS = /(スシロー|くら寿司|くらずし|はま寿司|かっぱ寿司|回転寿司|寿司|鮨|すし)/i;
const SMALL_SUSPICIOUS_AMOUNT = 100;

const MAX_REASONABLE_AMOUNT = 10_000_000;
const TODAY = new Date();

const THRESHOLDS = {
  vision: {
    autoDate: 0.72,
    autoAmount: 0.72,
    autoVendor: 0.7,
    candidateDate: 0.46,
    candidateAmount: 0.5,
    candidateVendor: 0.48,
  },
  fallback: {
    autoDate: 0.88,
    autoAmount: 0.88,
    autoVendor: 0.88,
    candidateDate: 0.58,
    candidateAmount: 0.8,
    candidateVendor: 0.6,
  },
} as const;

export function normalizeReceiptText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[‐‑‒–—―ー−]/g, "-")
    .replace(/[：]/g, ":")
    .replace(/[／]/g, "/")
    .replace(/[．]/g, ".")
    .replace(/\r/g, "")
    .trim();
}

export function createFallbackLines(rawText: string): ReceiptLine[] {
  return normalizeReceiptText(rawText)
    .split("\n")
    .map((text, index) => ({
      text: text.trim(),
      y: index * 24,
      x: 0,
      confidence: 0.45,
    }))
    .filter((line) => line.text);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function isValidDate(year: number, month: number, day: number) {
  if (year < 2000 || year > TODAY.getFullYear() + 1) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateDistanceScore(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const diffDays = Math.abs(date.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return 0.18;
  if (diffDays <= 31) return 0.1;
  if (diffDays <= 120) return 0.04;
  return -0.08;
}

function suspiciousVendor(text: string, provider: Provider) {
  const stripped = text.replace(/\s+/g, "");
  if (stripped.length < 2 || stripped.length > 28) return true;
  if (VENDOR_EXCLUDE_WORDS.test(text)) return true;
  if (/^[\d\s\-:/.]+$/.test(stripped)) return true;
  if ((stripped.match(/\d/g) || []).length / stripped.length > 0.28) return true;
  if ((stripped.match(/[A-Za-zぁ-んァ-ン一-龠々ー]/g) || []).length / stripped.length < (provider === "fallback" ? 0.52 : 0.42)) return true;
  if (/[@#%*_=]{2,}/.test(stripped)) return true;
  if (provider === "fallback" && /[^\wぁ-んァ-ン一-龠々ー()\s・&.,'-]/.test(stripped)) return true;
  return false;
}

function normalizeVendor(text: string) {
  return text
    .replace(/^[\s*■□◆◇・.\-]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseDateCandidates(lines: ReceiptLine[], rawText: string, provider: Provider): ScoredValue<string>[] {
  const candidates = new Map<string, ScoredValue<string>>();
  const lineTexts = lines.map((line) => line.text);
  const texts = [...lineTexts, rawText];
  const currentYear = TODAY.getFullYear();
  const patterns = [
    { regex: /((?:20)?\d{2})[\/.\-年]\s*(\d{1,2})[\/.\-月]\s*(\d{1,2})日?/g, withYear: true, order: "ymd" as const },
    { regex: /(\d{1,2})[\/.\-月]\s*(\d{1,2})日?\s*['’]?\s*((?:20)?\d{2})/g, withYear: true, order: "mdy" as const },
    { regex: /((?:\d{2}))\/(\d{1,2})\/(\d{1,2})/g, withYear: true, order: "ymd-short" as const },
    { regex: /(\d{1,2})[\/.\-月]\s*(\d{1,2})日?/g, withYear: false, order: "md" as const },
  ];

  texts.forEach((text, textIndex) => {
    const line = lines[textIndex];
    patterns.forEach(({ regex, withYear, order }) => {
      for (const match of text.matchAll(regex)) {
        let year = currentYear;
        let month = 0;
        let day = 0;

        if (order === "ymd") {
          year = Number(match[1]);
          month = Number(match[2]);
          day = Number(match[3]);
        } else if (order === "mdy") {
          month = Number(match[1]);
          day = Number(match[2]);
          year = Number(match[3]);
        } else if (order === "ymd-short") {
          year = 2000 + Number(match[1]);
          month = Number(match[2]);
          day = Number(match[3]);
        } else {
          month = Number(match[1]);
          day = Number(match[2]);
        }

        if (withYear && year < 100) year += 2000;
        if (!isValidDate(year, month, day)) continue;

        const value = formatDate(year, month, day);
        let score = provider === "fallback" ? 0.46 : 0.54;
        if (withYear) score += 0.08;
        if (!withYear) score -= 0.04;
        if (line && DATE_NEAR_WORDS.test(line.text)) score += 0.22;
        if (line && /\d{1,2}:\d{2}/.test(line.text)) score -= 0.12;
        if (line && line.y < 260) score += 0.06;
        if (line && /(TEL|電話|No\.?|番号)/i.test(line.text)) score -= 0.25;
        score += dateDistanceScore(value);

        const next = { value, confidence: clamp(score), reason: withYear ? "year-present" : "year-filled" };
        const prev = candidates.get(value);
        if (!prev || prev.confidence < next.confidence) candidates.set(value, next);
      }
    });

    for (const match of text.matchAll(/(?:令和|R)\s*(\d{1,2})[年\/.\-]\s*(\d{1,2})[月\/.\-]\s*(\d{1,2})日?/gi)) {
      const year = 2018 + Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (!isValidDate(year, month, day)) continue;

      const value = formatDate(year, month, day);
      let score = provider === "fallback" ? 0.62 : 0.7;
      if (line && DATE_NEAR_WORDS.test(line.text)) score += 0.16;
      score += dateDistanceScore(value);
      const next = { value, confidence: clamp(score), reason: "japanese-era" };
      const prev = candidates.get(value);
      if (!prev || prev.confidence < next.confidence) candidates.set(value, next);
    }
  });

  return Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence);
}

function amountLooksUnsafe(amount: number, line: string, provider: Provider) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_REASONABLE_AMOUNT) return true;
  if (amount >= 10_000_000) return true;
  if (provider === "fallback" && amount > 999_999 && !hasTotalWord(line)) return true;
  if (/^\d{8,}$/.test(String(amount)) && !/[¥￥,]/.test(line)) return true;
  return false;
}

function hasFinalTotalWord(text: string) {
  if (SUBTOTAL_WORDS.test(text) && !/(総合計|税込合計|grand\s*total|balance\s*due|amount\s*due)/i.test(text)) {
    return false;
  }
  return FINAL_TOTAL_WORDS.test(text);
}

function hasGenericTotalWord(text: string) {
  return GENERIC_TOTAL_WORDS.test(text) && !SUBTOTAL_WORDS.test(text);
}

function hasTotalWord(text: string) {
  return hasFinalTotalWord(text) || hasGenericTotalWord(text);
}

function extractNumbersFromLine(line: string) {
  const matches = line.match(/[¥￥]?\s*\d{1,3}(?:,\d{3})+|[¥￥]?\s*\d{1,8}/g) || [];
  return matches
    .map((match) => Number(match.replace(/[^\d]/g, "")))
    .filter((amount) => !Number.isNaN(amount));
}

function lineHasNumber(line?: string) {
  return Boolean(line && extractNumbersFromLine(line).length > 0);
}

function findNearbyLabel(lines: ReceiptLine[], index: number) {
  return [lines[index - 1]?.text, lines[index]?.text, lines[index + 1]?.text]
    .filter(Boolean)
    .join(" / ");
}

function isSeparatorLine(text?: string) {
  return Boolean(text && SEPARATOR_LINE.test(text.replace(/\s+/g, "")));
}

function isProductLikeLine(text?: string) {
  if (!text) return false;
  if (hasTotalWord(text) || PAYMENT_WORDS.test(text) || SUBTOTAL_WORDS.test(text)) return false;
  if (PRODUCT_LINE_WORDS.test(text)) return true;
  const numbers = extractNumbersFromLine(text);
  const letters = text.match(/[A-Za-zぁ-んァ-ン一-龠々ー]/g) || [];
  return numbers.length > 0 && letters.length >= 2 && !/[¥￥円]/.test(text);
}

function getLineStructure(lines: ReceiptLine[], index: number) {
  const prev = lines[index - 1]?.text || "";
  const next = lines[index + 1]?.text || "";
  const prev2 = lines[index - 2]?.text || "";
  const next2 = lines[index + 2]?.text || "";
  const denominator = Math.max(lines.length - 1, 1);
  const position = index / denominator;
  const lowerReceiptScore = clamp(position);
  const nearBottom = position >= 0.72;
  const finalRows = index >= Math.max(lines.length - 5, 0);
  const afterSeparator = isSeparatorLine(prev) || isSeparatorLine(prev2);
  const beforeSeparator = isSeparatorLine(next) || isSeparatorLine(next2);
  const adjacentProductCount = [prev, next, prev2, next2].filter(isProductLikeLine).length;
  const isolated = adjacentProductCount === 0 && (!lineHasNumber(prev) || isSeparatorLine(prev)) && (!lineHasNumber(next) || isSeparatorLine(next));

  return {
    lowerReceiptScore,
    nearBottom,
    finalRows,
    afterSeparator,
    beforeSeparator,
    isolated,
    adjacentProductCount,
  };
}

function getAmountLabelContext(lines: ReceiptLine[], index: number) {
  const line = lines[index]?.text || "";
  const prev = lines[index - 1]?.text || "";
  const next = lines[index + 1]?.text || "";
  const prev2 = lines[index - 2]?.text || "";
  const next2 = lines[index + 2]?.text || "";
  const adjacentLabel = [prev, next]
    .filter((text) => text && !lineHasNumber(text))
    .join(" / ");
  const blockLabel = [prev2, prev, next, next2]
    .filter((text) => text && !lineHasNumber(text))
    .join(" / ");
  const sameLineFinalTotal = hasFinalTotalWord(line);
  const sameLineGenericTotal = hasGenericTotalWord(line);
  const adjacentFinalTotal = !sameLineFinalTotal && hasFinalTotalWord(adjacentLabel);
  const adjacentGenericTotal = !sameLineFinalTotal && !sameLineGenericTotal && hasGenericTotalWord(adjacentLabel);
  const blockFinalTotal = !sameLineFinalTotal && !adjacentFinalTotal && hasFinalTotalWord(blockLabel);
  const blockGenericTotal =
    !sameLineFinalTotal && !sameLineGenericTotal && !adjacentFinalTotal && !adjacentGenericTotal && hasGenericTotalWord(blockLabel);

  return {
    sameLineFinalTotal,
    sameLineGenericTotal,
    adjacentFinalTotal,
    adjacentGenericTotal,
    blockFinalTotal,
    blockGenericTotal,
    hasTotal: sameLineFinalTotal || sameLineGenericTotal || adjacentFinalTotal || adjacentGenericTotal || blockFinalTotal || blockGenericTotal,
    hasStrongTotal: sameLineFinalTotal || adjacentFinalTotal || blockFinalTotal,
    hasAdjacentTotal: adjacentFinalTotal || adjacentGenericTotal || blockFinalTotal || blockGenericTotal,
    labelText: [prev2, prev, line, next, next2].filter(Boolean).join(" / "),
  };
}

function getAmountExcludedReason(amount: number, line: string, nearby: string, provider: Provider) {
  const context = `${line} ${nearby}`;
  if (amountLooksUnsafe(amount, line, provider)) return "not-reasonable-amount";
  if (/(tel|電話|fax)/i.test(context)) return "phone-number";
  if (/〒\s*\d{3}-?\d{4}/.test(context)) return "postal-code";
  if (CARD_DETAIL_WORDS.test(context) && !hasTotalWord(context)) return "card-or-receipt-number";
  if (/(レシート|伝票|会員|承認|取引|端末|登録|JAN|番号|No\.?)/i.test(context) && !/[¥￥円]/.test(context)) return "number-like-line";
  if (/\d{1,2}[:：]\d{2}/.test(context)) return "time-like-line";
  if (/\d{4}[\/.\-年]\d{1,2}[\/.\-月]\d{1,2}/.test(context)) return "date-like-line";
  if (/(税率|率)\s*\d{1,2}%?/.test(context) || /\d{1,2}\s*%/.test(line)) return "tax-rate";
  if (/(数量|個数|点数|単価)/.test(context) && !/[¥￥円]/.test(context)) return "quantity-or-unit";
  if (/(付与ポイント|利用ポイント|ポイント)/.test(context)) return "point-line";
  if (DISCOUNT_WORDS.test(context)) return "discount-line";
  if (SUBTOTAL_WORDS.test(context) && !hasFinalTotalWord(context)) return "subtotal-or-tax-line";
  return undefined;
}

function toAmountCandidateDebug(candidate: ScoredValue<number>): AmountCandidate {
  return {
    value: candidate.value,
    sourceLine: candidate.sourceLine || "",
    nearbyLabel: candidate.nearbyLabel || "",
    score: Number(candidate.confidence.toFixed(3)),
    reason: candidate.reason,
    excludedReason: candidate.excludedReason,
    selectedReason: candidate.selectedReason,
  };
}

function findRawTotalBlockCandidates(rawText: string, provider: Provider): ScoredValue<number>[] {
  const rows = normalizeReceiptText(rawText).split("\n").map((text) => text.trim()).filter(Boolean);
  const candidates: ScoredValue<number>[] = [];
  const sushiLikeReceipt = SUSHI_VENDOR_WORDS.test(rawText);

  rows.forEach((row, index) => {
    if (!hasTotalWord(row)) return;
    const block = rows.slice(Math.max(0, index - 2), Math.min(rows.length, index + 3));
    block.forEach((sourceLine) => {
      for (const amount of extractNumbersFromLine(sourceLine)) {
        const context = block.join(" / ");
        let excludedReason = getAmountExcludedReason(amount, sourceLine, context, provider);
        if (amount < SMALL_SUSPICIOUS_AMOUNT && (sushiLikeReceipt || SMALL_AMOUNT_CONTEXT_WORDS.test(context) || !hasFinalTotalWord(row))) {
          excludedReason ||= sushiLikeReceipt ? "small-sushi-like-amount-without-clear-total" : "small-amount-without-clear-total";
        }
        candidates.push({
          value: amount,
          confidence: excludedReason ? 0.24 : hasFinalTotalWord(row) ? 0.94 : 0.86,
          reason: hasFinalTotalWord(row) ? "raw-text-final-total-block" : "raw-text-total-block",
          sourceLine,
          nearbyLabel: context,
          excludedReason,
          selectedReason: "selected-from-raw-total-block",
        });
      }
    });
  });

  return candidates;
}

function parseAmountCandidates(lines: ReceiptLine[], provider: Provider, rawText: string): ScoredValue<number>[] {
  const candidates = new Map<number, ScoredValue<number>>();
  const paidCandidates: ScoredValue<number>[] = [];
  const changeCandidates: ScoredValue<number>[] = [];
  const sushiLikeReceipt = SUSHI_VENDOR_WORDS.test(rawText) || lines.slice(0, 10).some((line) => SUSHI_VENDOR_WORDS.test(line.text));

  lines.forEach((line, index) => {
    const amounts = extractNumbersFromLine(line.text);
    if (!amounts.length) return;

    const lower = line.text.toLowerCase();
    const nearbyLabel = findNearbyLabel(lines, index);
    const labelContext = getAmountLabelContext(lines, index);
    const structure = getLineStructure(lines, index);
    const context = `${lower} ${labelContext.labelText.toLowerCase()}`;
    const hasTotal = labelContext.hasTotal;
    const hasPayment = PAYMENT_WORDS.test(context);
    const hasChange = CHANGE_WORDS.test(context);
    const hasDiscount = DISCOUNT_WORDS.test(context);
    const hasSubtotal = SUBTOTAL_WORDS.test(context);
    const excludedByContext = AMOUNT_EXCLUDE_WORDS.test(context);
    const isTop = index < 4;

    amounts.forEach((amount) => {
      let excludedReason = getAmountExcludedReason(amount, line.text, labelContext.labelText, provider);

      let score = provider === "fallback" ? 0.18 : 0.35;
      const reasons: string[] = [];
      if (labelContext.sameLineFinalTotal) {
        score += provider === "fallback" ? 0.64 : 0.52;
        reasons.push("same-line-final-total-label");
      } else if (labelContext.sameLineGenericTotal) {
        score += provider === "fallback" ? 0.56 : 0.46;
        reasons.push("same-line-total-label");
      } else if (labelContext.adjacentFinalTotal) {
        score += provider === "fallback" ? 0.46 : 0.38;
        reasons.push("adjacent-final-total-label");
      } else if (labelContext.adjacentGenericTotal) {
        score += provider === "fallback" ? 0.34 : 0.28;
        reasons.push("adjacent-total-label");
      } else if (labelContext.blockFinalTotal) {
        score += provider === "fallback" ? 0.34 : 0.28;
        reasons.push("split-block-final-total-label");
      } else if (labelContext.blockGenericTotal) {
        score += provider === "fallback" ? 0.24 : 0.2;
        reasons.push("split-block-total-label");
      }
      if (/[¥￥円]/.test(line.text)) {
        score += 0.14;
        reasons.push("money-mark");
      }
      if (!isTop) score += 0.06;
      if (structure.lowerReceiptScore > 0.45) {
        score += 0.04 + structure.lowerReceiptScore * 0.11;
        reasons.push("lower-receipt-area");
      }
      if (structure.nearBottom) {
        score += 0.12;
        reasons.push("near-bottom-area");
      }
      if (structure.finalRows) {
        score += 0.1;
        reasons.push("final-rows-area");
      }
      if (structure.afterSeparator) {
        score += 0.12;
        reasons.push("after-separator");
      }
      if (structure.beforeSeparator) {
        score += 0.04;
        reasons.push("before-separator");
      }
      if (structure.isolated) {
        score += 0.1;
        reasons.push("isolated-amount-line");
      } else if (structure.adjacentProductCount >= 2 && !hasTotal) {
        score -= 0.18;
        reasons.push("near-product-lines");
      }
      if (hasPayment) {
        score -= hasTotal ? 0.08 : 0.52;
        reasons.push(hasTotal ? "payment-label-with-total" : "payment-label-candidate-only");
      }
      if (hasChange) {
        score -= 0.5;
        reasons.push("change-label");
      }
      if (hasDiscount) {
        score -= 0.56;
        reasons.push("discount-label");
      }
      if (hasSubtotal && !labelContext.hasStrongTotal) {
        score -= 0.34;
        reasons.push("subtotal-or-tax-label");
      }
      if (excludedByContext && !hasTotal) score -= 0.35;
      if (excludedReason) score -= 0.72;
      if (amount < SMALL_SUSPICIOUS_AMOUNT) {
        const hasSafeSmallTotal = labelContext.hasStrongTotal && !SMALL_AMOUNT_CONTEXT_WORDS.test(context) && !hasPayment && !hasDiscount && !hasSubtotal;
        if (!hasSafeSmallTotal) {
          score -= sushiLikeReceipt ? 0.78 : 0.48;
          reasons.push(sushiLikeReceipt ? "small-sushi-like-amount" : "small-amount-needs-clear-total");
          excludedReason ||= sushiLikeReceipt ? "small-sushi-like-amount-without-clear-total" : "small-amount-without-clear-total";
        }
      }
      if (/^\d{3}-\d{4}/.test(line.text)) score -= 0.25;
      if (/(tel|電話)/i.test(line.text) && amount >= 1_000_000) score -= 0.45;
      if (provider === "fallback" && !hasTotal && !/[¥￥]/.test(line.text)) score -= 0.18;
      if (provider === "fallback" && /(単価|数量|値引|割引)/.test(line.text)) score -= 0.28;
      if (line.confidence) score += (line.confidence - 0.5) * (provider === "fallback" ? 0.12 : 0.2);

      const next = {
        value: amount,
        confidence: clamp(score),
        reason: reasons.length ? reasons.join(",") : "amount-like-line",
        sourceLine: line.text,
        nearbyLabel: labelContext.labelText,
        excludedReason,
        selectedReason:
          hasTotal && !excludedReason
            ? labelContext.hasStrongTotal
              ? "selected-by-final-total-label"
              : "selected-by-total-label"
            : undefined,
      };
      if (PAID_WORDS.test(context) && !hasTotal && !excludedReason) paidCandidates.push(next);
      if (hasChange && !excludedReason) changeCandidates.push(next);
      const prev = candidates.get(amount);
      if (!prev || prev.confidence < next.confidence) candidates.set(amount, next);
    });
  });

  for (const candidate of findRawTotalBlockCandidates(rawText, provider)) {
    const prev = candidates.get(candidate.value);
    if (!prev || prev.confidence < candidate.confidence) candidates.set(candidate.value, candidate);
  }

  const hasClearTotal = Array.from(candidates.values()).some(
    (candidate) => /same-line-final-total-label|same-line-total-label|adjacent-final-total-label/.test(candidate.reason) && !candidate.excludedReason
  );
  if (!hasClearTotal && paidCandidates.length && changeCandidates.length) {
    const paid = paidCandidates.sort((a, b) => b.confidence - a.confidence)[0];
    const change = changeCandidates.sort((a, b) => b.confidence - a.confidence)[0];
    const value = paid.value - change.value;
    if (value > 0 && value <= MAX_REASONABLE_AMOUNT) {
      const next = {
        value,
        confidence: provider === "fallback" ? 0.9 : 0.82,
        reason: "paid-minus-change",
        sourceLine: `${paid.sourceLine} / ${change.sourceLine}`,
        nearbyLabel: `${paid.nearbyLabel} / ${change.nearbyLabel}`,
        selectedReason: "derived-from-payment-and-change-without-total-label",
      };
      const prev = candidates.get(value);
      if (!prev || prev.confidence < next.confidence) candidates.set(value, next);
    }
  }

  return Array.from(candidates.values()).sort(
    (a, b) =>
      b.confidence - a.confidence ||
      (a.sourceLine || "").localeCompare(b.sourceLine || "") ||
      a.value - b.value
  );
}

function parseVendorCandidates(lines: ReceiptLine[], provider: Provider): ScoredValue<string>[] {
  const candidates = new Map<string, ScoredValue<string>>();
  const sortedTopLines = [...lines]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .slice(0, 8);

  sortedTopLines.forEach((line, index) => {
    const text = normalizeVendor(line.text);
    if (suspiciousVendor(text, provider)) return;

    let score = provider === "fallback" ? 0.34 : 0.45;
    if (index <= 2) score += 0.14;
    if (line.y < 160) score += 0.1;
    if (/(店|ストア|マート|ショップ|商店|株式会社|有限会社|\(株\)|Inc\.?|LLC|Cafe|Store|Shop)/i.test(text)) score += 0.16;
    if (text.length >= 2 && text.length <= 16) score += 0.08;
    if (/^[ァ-ヶーA-Za-z0-9&.'\- ]+$/.test(text)) score += 0.04;
    if (/^[一-龠ぁ-んァ-ヶーA-Za-z0-9&.'\- ]+$/.test(text)) score += 0.04;
    if (line.confidence) score += (line.confidence - 0.5) * (provider === "fallback" ? 0.12 : 0.18);

    const next = { value: text, confidence: clamp(score), reason: index <= 2 ? "top-lines" : "upper-area" };
    const prev = candidates.get(text);
    if (!prev || prev.confidence < next.confidence) candidates.set(text, next);
  });

  return Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence);
}

function buildFieldResult<T extends string | number>(
  provider: Provider,
  field: CandidateField,
  candidates: ScoredValue<T>[],
  formatter: (value: T) => string
) {
  const thresholds = THRESHOLDS[provider];
  const autoThreshold =
    field === "date" ? thresholds.autoDate : field === "amount" ? thresholds.autoAmount : thresholds.autoVendor;
  const candidateThreshold =
    field === "date" ? thresholds.candidateDate : field === "amount" ? thresholds.candidateAmount : thresholds.candidateVendor;

  const accepted: DebugItem[] = [];
  const rejected: DebugItem[] = [];

  candidates.forEach((candidate, index) => {
    const value = formatter(candidate.value);
    if (candidate.excludedReason) {
      rejected.push({
        field,
        value,
        confidence: candidate.confidence,
        reason: `${candidate.excludedReason}:${candidate.reason}`,
      });
    } else if (candidate.confidence >= candidateThreshold) {
      accepted.push({ field, value, confidence: candidate.confidence, reason: candidate.reason });
    } else if (index < 6) {
      rejected.push({ field, value, confidence: candidate.confidence, reason: `below-candidate-threshold:${candidate.reason}` });
    }
  });

  const autoCandidate = candidates.find(
    (candidate) =>
      !candidate.excludedReason &&
      !/payment-label-candidate-only|change-label|discount-label|subtotal-or-tax-label|point-line|tax-amount/.test(candidate.reason)
  );
  const auto = autoCandidate && autoCandidate.confidence >= autoThreshold ? autoCandidate : undefined;
  if (candidates[0] && !auto) {
    rejected.unshift({
      field,
      value: formatter(candidates[0].value),
      confidence: candidates[0].confidence,
      reason: `below-auto-threshold:${candidates[0].reason}`,
    });
  }

  return {
    autoValue: auto?.value,
    autoConfidence: auto?.confidence,
    candidateValues: unique(
      accepted
        .map((item) => item.value)
        .filter((value) => value !== (auto ? formatter(auto.value) : ""))
    ).slice(0, 4),
    accepted,
    rejected: rejected.slice(0, 10),
  };
}

export function extractReceiptFields(rawText: string, rawLines: ReceiptLine[], provider: Provider): ReceiptAnalysis {
  const normalizedRawText = normalizeReceiptText(rawText);
  const lines = rawLines
    .map((line) => ({
      ...line,
      text: normalizeReceiptText(line.text),
    }))
    .filter((line) => line.text);

  const dateCandidates = parseDateCandidates(lines, normalizedRawText, provider);
  const amountCandidates = parseAmountCandidates(lines, provider, normalizedRawText);
  const vendorCandidates = parseVendorCandidates(lines, provider);

  const dateResult = buildFieldResult(provider, "date", dateCandidates, (value) => value);
  const amountResult = buildFieldResult(provider, "amount", amountCandidates, (value) => String(value));
  const vendorResult = buildFieldResult(provider, "vendorName", vendorCandidates, (value) => value);

  const extracted: OcrExtracted = {
    date: dateResult.autoValue,
    amount: amountResult.autoValue,
    vendorName: vendorResult.autoValue,
    dateConfidence: dateResult.autoConfidence,
    amountConfidence: amountResult.autoConfidence,
    vendorConfidence: vendorResult.autoConfidence,
    dateCandidates: dateResult.candidateValues,
    amountCandidates: amountCandidates
      .map((candidate) => ({
        ...candidate,
        selectedReason:
          amountResult.autoValue === candidate.value
            ? candidate.selectedReason || "selected-by-score-and-context"
            : candidate.selectedReason,
      }))
      .map(toAmountCandidateDebug)
      .slice(0, 10),
    vendorNameCandidates: vendorResult.candidateValues,
    provider,
    debug: {
      accepted: [...dateResult.accepted, ...amountResult.accepted, ...vendorResult.accepted],
      rejected: [...dateResult.rejected, ...amountResult.rejected, ...vendorResult.rejected],
    },
  };

  return {
    rawText: normalizedRawText,
    lines,
    extracted,
  };
}
