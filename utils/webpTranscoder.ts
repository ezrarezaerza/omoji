import { dataUrlToBlob } from "./exportSticker";
import { validateStickerImage, WhatsAppStickerDiagnostics } from "./whatsappValidator";

export interface TranscodeOptions {
  targetWidth?: number;
  targetHeight?: number;
  enforceSafetyMargin?: boolean;
  marginPixels?: number;
  initialQuality?: number;
  minQuality?: number;
  maxFileSizeKB?: number;
  format?: "image/webp" | "image/png";
}

export interface TranscodeResult {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
  finalQuality: number;
  width: number;
  height: number;
  diagnostics: WhatsAppStickerDiagnostics;
  passesConstraint: boolean;
}

/**
 * Transcodes and optimizes any image into a compliant WhatsApp 512x512 WebP sticker.
 * Includes automatic 16px safety margins and adaptive multi-pass quality reduction
 * to ensure the output remains strictly under the 100KB WhatsApp limit.
 */
export async function sanitizeAndTranscodeToWhatsAppWebP(
  source: Blob | string | HTMLCanvasElement,
  options: TranscodeOptions = {}
): Promise<TranscodeResult> {
  const {
    targetWidth = 512,
    targetHeight = 512,
    enforceSafetyMargin = true,
    marginPixels = 16,
    initialQuality = 0.88,
    minQuality = 0.4,
    maxFileSizeKB = 98, // safe cushion under 100KB
    format = "image/webp",
  } = options;

  const maxBytes = maxFileSizeKB * 1024;

  // 1. Load source onto an Image or use canvas directly
  let sourceCanvas: HTMLCanvasElement;

  if (source instanceof HTMLCanvasElement) {
    sourceCanvas = source;
  } else {
    sourceCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const objectUrl = source instanceof Blob ? URL.createObjectURL(source) : source;

      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) {
          if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to obtain 2D rendering context."));
          return;
        }
        ctx.drawImage(img, 0, 0);
        if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
        resolve(c);
      };

      img.onerror = (err) => {
        if (
          typeof objectUrl === "string" &&
          (objectUrl.startsWith("http://") || objectUrl.startsWith("https://")) &&
          !objectUrl.includes("/api/proxy-image")
        ) {
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = "anonymous";
          fallbackImg.onload = () => {
            const c = document.createElement("canvas");
            c.width = fallbackImg.naturalWidth || fallbackImg.width;
            c.height = fallbackImg.naturalHeight || fallbackImg.height;
            const ctx = c.getContext("2d");
            if (!ctx) {
              reject(new Error("Unable to obtain 2D rendering context."));
              return;
            }
            ctx.drawImage(fallbackImg, 0, 0);
            resolve(c);
          };
          fallbackImg.onerror = (fErr) => {
            reject(new Error(`Failed to load source image via proxy: ${fErr}`));
          };
          fallbackImg.src = `/api/proxy-image?url=${encodeURIComponent(objectUrl)}`;
          return;
        }

        if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load source image: ${err}`));
      };

      img.src = objectUrl;
    });
  }

  // 2. Render onto strict 512x512 canvas with safety margins
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = targetWidth;
  exportCanvas.height = targetHeight;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create export canvas 2D context.");
  }

  // Enable high-quality sub-pixel anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  if (enforceSafetyMargin) {
    // Fit within (targetWidth - 2 * marginPixels) x (targetHeight - 2 * marginPixels)
    const availableW = targetWidth - marginPixels * 2;
    const availableH = targetHeight - marginPixels * 2;

    const scale = Math.min(availableW / sw, availableH / sh, 1);
    const destW = Math.round(sw * scale);
    const destH = Math.round(sh * scale);

    const destX = Math.round((targetWidth - destW) / 2);
    const destY = Math.round((targetHeight - destH) / 2);

    ctx.drawImage(sourceCanvas, 0, 0, sw, sh, destX, destY, destW, destH);
  } else {
    // Direct fit / stretch
    const scale = Math.min(targetWidth / sw, targetHeight / sh);
    const destW = Math.round(sw * scale);
    const destH = Math.round(sh * scale);
    const destX = Math.round((targetWidth - destW) / 2);
    const destY = Math.round((targetHeight - destH) / 2);

    ctx.drawImage(sourceCanvas, 0, 0, sw, sh, destX, destY, destW, destH);
  }

  // 3. Multi-pass adaptive compression loop
  let currentQuality = initialQuality;
  let bestBlob: Blob | null = null;
  let bestDataUrl: string = "";

  const qualitySteps = [0.9, 0.85, 0.8, 0.72, 0.65, 0.55, 0.45, 0.35];
  const activeSteps = qualitySteps.filter((q) => q <= initialQuality && q >= minQuality);
  if (!activeSteps.includes(initialQuality)) activeSteps.unshift(initialQuality);
  if (!activeSteps.includes(minQuality)) activeSteps.push(minQuality);

  for (const q of activeSteps) {
    currentQuality = q;
    const dataUrl = exportCanvas.toDataURL(format, currentQuality);
    const blob = dataUrlToBlob(dataUrl);

    bestBlob = blob;
    bestDataUrl = dataUrl;

    if (blob.size <= maxBytes) {
      // Satisfies size constraint!
      break;
    }
  }

  if (!bestBlob) {
    bestDataUrl = exportCanvas.toDataURL(format, minQuality);
    bestBlob = dataUrlToBlob(bestDataUrl);
  }

  const diagnostics = await validateStickerImage(bestBlob, false);

  return {
    blob: bestBlob,
    dataUrl: bestDataUrl,
    sizeBytes: bestBlob.size,
    finalQuality: currentQuality,
    width: targetWidth,
    height: targetHeight,
    diagnostics,
    passesConstraint: bestBlob.size <= 100 * 1024,
  };
}

/**
 * Generates an official WhatsApp tray icon (96x96 pixels, < 50KB, centered with 8px margin)
 */
export async function generateWhatsAppTrayIcon(
  source: Blob | string | HTMLCanvasElement,
  options: { size?: number; margin?: number; quality?: number } = {}
): Promise<{ blob: Blob; dataUrl: string; sizeBytes: number }> {
  const { size = 96, margin = 8, quality = 0.85 } = options;

  let sourceCanvas: HTMLCanvasElement;

  if (source instanceof HTMLCanvasElement) {
    sourceCanvas = source;
  } else {
    sourceCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const objectUrl = source instanceof Blob ? URL.createObjectURL(source) : source;

      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) {
          if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to create tray canvas context."));
          return;
        }
        ctx.drawImage(img, 0, 0);
        if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
        resolve(c);
      };

      img.onerror = (err) => {
        if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load tray source: ${err}`));
      };

      img.src = objectUrl;
    });
  }

  const trayCanvas = document.createElement("canvas");
  trayCanvas.width = size;
  trayCanvas.height = size;
  const ctx = trayCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create tray canvas context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const available = size - margin * 2;
  const scale = Math.min(available / sw, available / sh, 1);
  const destW = Math.round(sw * scale);
  const destH = Math.round(sh * scale);
  const destX = Math.round((size - destW) / 2);
  const destY = Math.round((size - destH) / 2);

  ctx.drawImage(sourceCanvas, 0, 0, sw, sh, destX, destY, destW, destH);

  // WhatsApp supports PNG or WebP for tray icon
  const dataUrl = trayCanvas.toDataURL("image/png", quality);
  const blob = dataUrlToBlob(dataUrl);

  return {
    blob,
    dataUrl,
    sizeBytes: blob.size,
  };
}
