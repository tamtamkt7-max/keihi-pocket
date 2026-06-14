import { VendorSuggestion } from "@/types/vendorSuggestion";

const BLOCKED_VENDOR_PATTERNS = [
  /領収書/,
  /レシート/,
  /明細/,
  /合計/,
  /小計/,
  /税込/,
  /税抜/,
  /現金/,
  /お預り/,
  /お釣り/,
  /釣銭/,
  /車検\s*予約\s*受付\s*中/,
  /いつもありがとうございます/,
  /ありがとうございました/,
  /登録番号/,
  /^T\d{13}$/,
  /^TEL/i,
  /電話/,
  /〒/,
  /https?:\/\//i,
];

export function normalizeVendorName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[　・･,，.．]/g, "")
    .toLowerCase();
}

export function isUsableVendorName(value?: string | null) {
  const name = (value || "").trim();
  if (name.length < 2 || name.length > 80) return false;
  if (/^[\d\s\-/:.]+$/.test(name)) return false;
  if (BLOCKED_VENDOR_PATTERNS.some((pattern) => pattern.test(name))) return false;
  const letters = name.replace(/[0-9\s\-/:.円¥￥]/g, "");
  return letters.length >= 2;
}

function bigrams(value: string) {
  const chars = [...normalizeVendorName(value)];
  if (chars.length <= 1) return chars;
  return chars.slice(0, -1).map((_, index) => chars.slice(index, index + 2).join(""));
}

function similarity(a: string, b: string) {
  const left = bigrams(a);
  const right = new Set(bigrams(b));
  if (!left.length || !right.size) return 0;
  const hits = left.filter((item) => right.has(item)).length;
  return hits / Math.max(left.length, right.size);
}

export function findVendorSuggestion(input: string, suggestions: VendorSuggestion[]) {
  const name = input.trim();
  if (!name || suggestions.length === 0) return null;
  const normalized = normalizeVendorName(name);
  const exact = suggestions.find((item) => item.normalizedName === normalized);
  if (exact) return exact;

  const ranked = suggestions
    .filter((item) => isUsableVendorName(item.name))
    .map((item) => ({
      item,
      score:
        item.normalizedName.includes(normalized) || normalized.includes(item.normalizedName)
          ? 0.92
          : similarity(name, item.name),
    }))
    .sort((a, b) => b.score - a.score || b.item.count - a.item.count);

  return ranked[0]?.score >= 0.55 ? ranked[0].item : null;
}
