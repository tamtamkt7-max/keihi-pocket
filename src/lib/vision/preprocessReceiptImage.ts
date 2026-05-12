import sharp from "sharp";

export type ReceiptImageVariantName =
  | "original"
  | "enhanced"
  | "center-focus"
  | "rotate90"
  | "rotate270";

export type ReceiptImageVariant = {
  name: ReceiptImageVariantName;
  buffer: Buffer;
  width: number;
  height: number;
};

const MAX_EDGE = 2000;

async function normalizeBaseImage(input: Buffer) {
  return sharp(input, { failOn: "none", limitInputPixels: false })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function buildEnhancedVariant(baseBuffer: Buffer) {
  return sharp(baseBuffer)
    .normalise()
    .modulate({ brightness: 1.08, saturation: 0.96 })
    .sharpen({ sigma: 1.2 })
    .grayscale()
    .linear(1.18, -8)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

async function buildCenterFocusVariant(baseBuffer: Buffer) {
  const image = sharp(baseBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    return sharp(baseBuffer)
      .normalise()
      .sharpen()
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  }

  const cropWidth = Math.max(Math.floor(width * 0.9), Math.min(width, 720));
  const cropHeight = Math.max(Math.floor(height * 0.92), Math.min(height, 960));
  const left = Math.max(Math.floor((width - cropWidth) / 2), 0);
  const top = Math.max(Math.floor((height - cropHeight) / 2), 0);

  return sharp(baseBuffer)
    .extract({ left, top, width: Math.min(cropWidth, width - left), height: Math.min(cropHeight, height - top) })
    .normalise()
    .sharpen({ sigma: 1.1 })
    .grayscale()
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

async function buildRotatedVariant(baseBuffer: Buffer, angle: 90 | 270) {
  return sharp(baseBuffer)
    .rotate(angle)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function toVariant(name: ReceiptImageVariantName, buffer: Buffer): Promise<ReceiptImageVariant> {
  const metadata = await sharp(buffer).metadata();
  return {
    name,
    buffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export async function prepareReceiptImageVariants(input: Buffer): Promise<ReceiptImageVariant[]> {
  const base = await normalizeBaseImage(input);
  const [enhanced, centerFocus, rotate90, rotate270] = await Promise.all([
    buildEnhancedVariant(base),
    buildCenterFocusVariant(base),
    buildRotatedVariant(base, 90),
    buildRotatedVariant(base, 270),
  ]);

  return Promise.all([
    toVariant("original", base),
    toVariant("enhanced", enhanced),
    toVariant("center-focus", centerFocus),
    toVariant("rotate90", rotate90),
    toVariant("rotate270", rotate270),
  ]);
}
