import { NextRequest, NextResponse } from "next/server";
import { HighAccuracyReceiptResult } from "@/lib/receipt/highAccuracyReceipt";

export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const receiptSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: ["string", "null"], description: "Receipt date in YYYY-MM-DD format, or null." },
    time: { type: ["string", "null"], description: "Receipt time in HH:mm format, or null." },
    amount: { type: ["number", "null"], description: "Final paid total amount. Do not use subtotal, tax, tendered cash, or change." },
    vendor: { type: ["string", "null"], description: "Store, company, or counterparty name." },
    address: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    paymentMethod: { type: ["string", "null"] },
    categorySuggestion: { type: ["string", "null"] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: ["string", "null"] },
          unitPrice: { type: ["number", "null"] },
          amount: { type: ["number", "null"] },
        },
        required: ["name", "quantity", "unitPrice", "amount"],
      },
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        date: { type: "number", minimum: 0, maximum: 1 },
        amount: { type: "number", minimum: 0, maximum: 1 },
        vendor: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["date", "amount", "vendor"],
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "date",
    "time",
    "amount",
    "vendor",
    "address",
    "phone",
    "paymentMethod",
    "categorySuggestion",
    "items",
    "confidence",
    "warnings",
  ],
} as const;

function extractOutputText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;
  const parts = (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((content: any) => content?.text || content?.value || "")
    .filter(Boolean);
  return parts.join("\n");
}

function normalizeResult(value: HighAccuracyReceiptResult): HighAccuracyReceiptResult {
  return {
    date: value.date || null,
    time: value.time || null,
    amount: typeof value.amount === "number" && Number.isFinite(value.amount) ? value.amount : null,
    vendor: value.vendor?.trim() || null,
    address: value.address?.trim() || null,
    phone: value.phone?.trim() || null,
    paymentMethod: value.paymentMethod?.trim() || null,
    categorySuggestion: value.categorySuggestion?.trim() || null,
    items: Array.isArray(value.items)
      ? value.items
          .filter((item) => item?.name)
          .map((item) => ({
            name: String(item.name).trim(),
            quantity: item.quantity ? String(item.quantity).trim() : null,
            unitPrice: typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) ? item.unitPrice : null,
            amount: typeof item.amount === "number" && Number.isFinite(item.amount) ? item.amount : null,
          }))
          .slice(0, 12)
      : [],
    confidence: {
      date: Math.max(0, Math.min(1, Number(value.confidence?.date || 0))),
      amount: Math.max(0, Math.min(1, Number(value.confidence?.amount || 0))),
      vendor: Math.max(0, Math.min(1, Number(value.confidence?.vendor || 0))),
    },
    warnings: Array.isArray(value.warnings) ? value.warnings.map(String).slice(0, 6) : [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { available: false, message: "高精度読み取りは今は使えません。手入力できます。" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ available: false, message: "画像を選んでください。" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ available: false, message: "画像が大きすぎます。別の写真でお試しください。" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const imageUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const model = process.env.OPENAI_RECEIPT_MODEL || DEFAULT_MODEL;

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You extract Japanese receipt data. Return only values visible in the image. Use null when uncertain. The result is a user-editable draft, not tax advice.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "画像全体からレシート・領収書の内容を読み取ってください。",
                  "amount は最終的に支払う合計金額を入れ、小計、税額、お預り、お釣りと混同しないでください。",
                  "vendor は上部だけでなく下部の店舗情報も確認してください。",
                  "有限会社、株式会社、合同会社、SS、サービスステーション、給油所を含む行は店名候補にしてください。",
                  "住所や電話番号の近くにある会社名・店舗名も確認してください。",
                  "住所、電話番号、登録番号、日時、No.、取引番号、領収書、レシート、合計、小計、現金、お預りは店名にしないでください。",
                  "分類候補はアプリの分類名に寄せてください。ガソリン、給油、レギュラー、軽油、灯油があれば「ガソリン代」。飲食店なら「飲食費」または「食費」。コンビニなら「コンビニ」。",
                  "判断できない項目は null にしてください。自信が低い項目は warnings に短く入れてください。",
                ].join("\n"),
              },
              {
                type: "input_image",
                image_url: imageUrl,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt_extraction",
            strict: true,
            schema: receiptSchema,
          },
        },
        max_output_tokens: 1400,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.warn("[receipt-ai-extract] request failed", { status: response.status, details: details.slice(0, 600) });
      return NextResponse.json(
        { available: false, message: "うまく読み取れませんでした。手入力できます。" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    const parsed = JSON.parse(outputText) as HighAccuracyReceiptResult;
    return NextResponse.json({ available: true, result: normalizeResult(parsed) });
  } catch (error) {
    console.warn("[receipt-ai-extract] failed", error);
    return NextResponse.json(
      { available: false, message: "うまく読み取れませんでした。手入力できます。" },
      { status: 502 }
    );
  }
}
