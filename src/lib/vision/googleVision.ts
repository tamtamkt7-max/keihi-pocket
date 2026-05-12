import { createSign } from "crypto";
import { extractReceiptFields, ReceiptLine } from "@/lib/receipt/extractReceiptFields";
import { OcrExtracted } from "@/types/record";

type VisionResponse = {
  responses?: Array<{
    error?: { message?: string };
    fullTextAnnotation?: {
      text?: string;
      pages?: Array<{
        blocks?: Array<{
          boundingBox?: { vertices?: Array<{ x?: number; y?: number }> };
          confidence?: number;
          paragraphs?: Array<{
            boundingBox?: { vertices?: Array<{ x?: number; y?: number }> };
            confidence?: number;
            words?: Array<{
              boundingBox?: { vertices?: Array<{ x?: number; y?: number }> };
              confidence?: number;
              symbols?: Array<{
                text?: string;
                property?: { detectedBreak?: { type?: string } };
              }>;
            }>;
          }>;
        }>;
      }>;
    };
    textAnnotations?: Array<{ description?: string }>;
  }>;
};

type VisionAnnotateResponse = NonNullable<VisionResponse["responses"]>[number];
type VisionPage = NonNullable<NonNullable<NonNullable<VisionAnnotateResponse["fullTextAnnotation"]>["pages"]>[number]>;
type VisionBlock = NonNullable<NonNullable<VisionPage["blocks"]>[number]>;
type VisionParagraph = NonNullable<NonNullable<VisionBlock["paragraphs"]>[number]>;
type VisionWord = NonNullable<NonNullable<VisionParagraph["words"]>[number]>;
type VisionSymbol = NonNullable<NonNullable<VisionWord["symbols"]>[number]>;

export type VisionReceiptAnalysis = {
  variant: string;
  rawText: string;
  lines: ReceiptLine[];
  extracted: OcrExtracted;
  provider: "vision";
};

type VisionAuthConfig =
  | { method: "api-key"; apiKey: string }
  | { method: "service-account"; clientEmail: string; privateKey: string; projectId: string };

function getVisionConfig(): VisionAuthConfig | null {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (apiKey) return { method: "api-key", apiKey };

  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) return null;
  return { method: "service-account", clientEmail, privateKey, projectId };
}

export function googleVisionConfigured() {
  return Boolean(getVisionConfig());
}

export function getGoogleVisionAuthStatus() {
  const config = getVisionConfig();
  return {
    configured: Boolean(config),
    method: config?.method || "none",
    apiKeyPresent: Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim()),
    serviceAccountPresent: Boolean(
      process.env.GOOGLE_CLOUD_CLIENT_EMAIL &&
        process.env.GOOGLE_CLOUD_PRIVATE_KEY &&
        process.env.GOOGLE_CLOUD_PROJECT_ID
    ),
  };
}

function encodeBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken() {
  const config = getVisionConfig();
  if (!config || config.method !== "service-account") return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedToken = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(claimSet))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer.sign(config.privateKey);
  const assertion = `${unsignedToken}.${encodeBase64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to get Google access token: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token || null;
}

function averageVertex(vertices?: Array<{ x?: number; y?: number }>) {
  if (!vertices?.length) return { x: 0, y: 0 };
  const sums = vertices.reduce(
    (acc, vertex) => ({
      x: (acc.x ?? 0) + (vertex.x ?? 0),
      y: (acc.y ?? 0) + (vertex.y ?? 0),
    }),
    { x: 0, y: 0 }
  );
  return {
    x: (sums.x ?? 0) / vertices.length,
    y: (sums.y ?? 0) / vertices.length,
  };
}

function buildLinesFromVision(response: VisionAnnotateResponse) {
  const lines: ReceiptLine[] = [];
  const pages: VisionPage[] = response.fullTextAnnotation?.pages || [];

  pages.forEach((page: VisionPage) => {
    (page.blocks || []).forEach((block: VisionBlock) => {
      (block.paragraphs || []).forEach((paragraph: VisionParagraph) => {
        const words: VisionWord[] = paragraph.words || [];
        const text = words
          .map((word: VisionWord) =>
            (word.symbols || [])
              .map((symbol: VisionSymbol) => symbol.text || "")
              .join("")
          )
          .join(" ")
          .trim();

        if (!text) return;

        const box = averageVertex(paragraph.boundingBox?.vertices || block.boundingBox?.vertices);
        const wordConfidences = words
          .map((word: VisionWord) => word.confidence)
          .filter((confidence: number | undefined): confidence is number => typeof confidence === "number");
        const confidence =
          wordConfidences.length > 0
            ? wordConfidences.reduce((sum: number, value: number) => sum + value, 0) / wordConfidences.length
            : paragraph.confidence || block.confidence;

        lines.push({
          text,
          x: box.x,
          y: box.y,
          confidence,
        });
      });
    });
  });

  return lines.sort((a, b) => a.y - b.y || a.x - b.x);
}

export async function analyzeReceiptBufferWithGoogleVision(imageBuffer: Buffer, variant: string): Promise<VisionReceiptAnalysis | null> {
  const config = getVisionConfig();
  if (!config) return null;

  const accessToken = config.method === "service-account" ? await getAccessToken() : null;
  if (config.method === "service-account" && !accessToken) return null;

  const endpoint =
    config.method === "api-key"
      ? `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(config.apiKey)}`
      : "https://vision.googleapis.com/v1/images:annotate";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      requests: [
        {
          image: {
            content: imageBuffer.toString("base64"),
          },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: {
            languageHints: ["ja", "en"],
          },
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Vision request failed: ${response.status}`);
  }

  const data = (await response.json()) as VisionResponse;
  const result = data.responses?.[0];
  if (!result) {
    throw new Error("Google Vision returned no response");
  }
  if (result.error?.message) {
    throw new Error(result.error.message);
  }

  const rawText = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "";
  const lines = buildLinesFromVision(result);
  const analysis = extractReceiptFields(rawText, lines, "vision");

  return {
    ...analysis,
    provider: "vision",
    variant,
  };
}
