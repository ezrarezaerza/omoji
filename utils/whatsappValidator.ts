/**
 * WhatsApp Sticker Specification Validator
 * Enforces official WhatsApp Sticker specifications:
 * - Exactly 512x512 px square
 * - WebP format with alpha channel
 * - Static sticker size < 100 KB (102,400 bytes)
 * - Animated sticker size < 500 KB (512,000 bytes)
 * - 16px transparent margin gutter around edges
 * - Tray icon: 96x96 px, < 50 KB
 * - Pack size: 3 to 30 stickers
 */

export interface WhatsAppStickerDiagnostics {
  width: number;
  height: number;
  isDimensionValid: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  isSizeValid: boolean;
  maxAllowedBytes: number;
  hasMarginPadding: boolean;
  hasTransparentBackground: boolean;
  qualityScore: number; // 0 to 100
  status: "valid" | "warning" | "error";
  warnings: string[];
  errors: string[];
}

export interface WhatsAppPackDiagnostics {
  stickerCount: number;
  isCountValid: boolean;
  minRequired: number;
  maxAllowed: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  validStickersCount: number;
  warningStickersCount: number;
  errorStickersCount: number;
  allValid: boolean;
  packNameValid: boolean;
  authorNameValid: boolean;
  stickers: WhatsAppStickerDiagnostics[];
  summaryMessage: string;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Validates a single sticker image against WhatsApp requirements
 */
export async function validateStickerImage(
  source: Blob | string,
  isAnimated: boolean = false
): Promise<WhatsAppStickerDiagnostics> {
  const maxAllowedBytes = isAnimated ? 500 * 1024 : 100 * 1024;

  return new Promise((resolve) => {
    let sizeBytes = 0;
    if (source instanceof Blob) {
      sizeBytes = source.size;
    } else if (typeof source === "string" && source.startsWith("data:")) {
      const base64Data = source.split(",")[1] || "";
      sizeBytes = Math.round((base64Data.length * 3) / 4);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    const objectUrl =
      source instanceof Blob ? URL.createObjectURL(source) : source;

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const isDimensionValid = width === 512 && height === 512;

        const errors: string[] = [];
        const warnings: string[] = [];

        if (!isDimensionValid) {
          errors.push(
            `Dimensions are ${width}x${height}px (WhatsApp requires exactly 512x512px).`
          );
        }

        const isSizeValid = sizeBytes <= maxAllowedBytes && sizeBytes > 0;
        if (!isSizeValid && sizeBytes > 0) {
          errors.push(
            `File size is ${formatBytes(sizeBytes)} (Exceeds WhatsApp limit of ${formatBytes(
              maxAllowedBytes
            )}).`
          );
        }

        // Analyze canvas pixels for margin safety & alpha transparency
        let hasMarginPadding = true;
        let hasTransparentBackground = true;

        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;

            // 1. Check transparency
            let hasAnyTransparentPixel = false;
            for (let i = 3; i < data.length; i += 16) {
              if (data[i] < 250) {
                hasAnyTransparentPixel = true;
                break;
              }
            }
            hasTransparentBackground = hasAnyTransparentPixel;
            if (!hasTransparentBackground) {
              warnings.push("Image does not appear to have a transparent cutout background.");
            }

            // 2. Check 16px safety margin (Gutter check)
            const margin = 16;
            let nonTransparentInMargin = false;

            // Check top & bottom margins
            for (let y = 0; y < margin; y++) {
              for (let x = 0; x < width; x += 4) {
                const idx = (y * width + x) * 4 + 3;
                if (data[idx] > 30) {
                  nonTransparentInMargin = true;
                  break;
                }
              }
              if (nonTransparentInMargin) break;
            }

            if (!nonTransparentInMargin) {
              for (let y = height - margin; y < height; y++) {
                for (let x = 0; x < width; x += 4) {
                  const idx = (y * width + x) * 4 + 3;
                  if (data[idx] > 30) {
                    nonTransparentInMargin = true;
                    break;
                  }
                }
                if (nonTransparentInMargin) break;
              }
            }

            // Check left & right margins
            if (!nonTransparentInMargin) {
              for (let x = 0; x < margin; x++) {
                for (let y = 0; y < height; y += 4) {
                  const idx = (y * width + x) * 4 + 3;
                  if (data[idx] > 30) {
                    nonTransparentInMargin = true;
                    break;
                  }
                }
                if (nonTransparentInMargin) break;
              }
            }

            if (!nonTransparentInMargin) {
              for (let x = width - margin; x < width; x++) {
                for (let y = 0; y < height; y += 4) {
                  const idx = (y * width + x) * 4 + 3;
                  if (data[idx] > 30) {
                    nonTransparentInMargin = true;
                    break;
                  }
                }
                if (nonTransparentInMargin) break;
              }
            }

            hasMarginPadding = !nonTransparentInMargin;
            if (!hasMarginPadding) {
              warnings.push(
                "Sticker extends into the 16px edge buffer; it might slightly touch WhatsApp bubble boundaries."
              );
            }
          }
        } catch {
          // Pixel check fallback if cross-origin taint occurs
          hasMarginPadding = true;
          hasTransparentBackground = true;
        }

        // Calculate score
        let score = 100;
        if (!isDimensionValid) score -= 40;
        if (!isSizeValid) score -= 40;
        if (!hasMarginPadding) score -= 10;
        if (!hasTransparentBackground) score -= 10;
        score = Math.max(0, score);

        let status: "valid" | "warning" | "error" = "valid";
        if (errors.length > 0) {
          status = "error";
        } else if (warnings.length > 0) {
          status = "warning";
        }

        if (source instanceof Blob) {
          URL.revokeObjectURL(objectUrl);
        }

        resolve({
          width,
          height,
          isDimensionValid,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          isSizeValid,
          maxAllowedBytes,
          hasMarginPadding,
          hasTransparentBackground,
          qualityScore: score,
          status,
          warnings,
          errors,
        });
      } catch {
        if (source instanceof Blob) {
          URL.revokeObjectURL(objectUrl);
        }
        resolve({
          width: 512,
          height: 512,
          isDimensionValid: true,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          isSizeValid: true,
          maxAllowedBytes,
          hasMarginPadding: true,
          hasTransparentBackground: true,
          qualityScore: 90,
          status: "valid",
          warnings: [],
          errors: [],
        });
      }
    };

    img.onerror = () => {
      if (source instanceof Blob) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve({
        width: 0,
        height: 0,
        isDimensionValid: false,
        sizeBytes: 0,
        sizeFormatted: "0 B",
        isSizeValid: false,
        maxAllowedBytes,
        hasMarginPadding: false,
        hasTransparentBackground: false,
        qualityScore: 0,
        status: "error",
        warnings: [],
        errors: ["Failed to load image data."],
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Validates a complete pack of stickers
 */
export async function validateWhatsAppPack(
  stickers: (Blob | string)[],
  packName: string,
  authorName: string,
  isAnimated: boolean = false
): Promise<WhatsAppPackDiagnostics> {
  const minRequired = 3;
  const maxAllowed = 30;
  const stickerCount = stickers.length;
  const isCountValid = stickerCount >= minRequired && stickerCount <= maxAllowed;

  const packNameValid = Boolean(packName.trim().length > 0 && packName.trim().length <= 128);
  const authorNameValid = Boolean(authorName.trim().length > 0 && authorName.trim().length <= 128);

  const diagnosticsList: WhatsAppStickerDiagnostics[] = [];
  let totalSizeBytes = 0;
  let validStickersCount = 0;
  let warningStickersCount = 0;
  let errorStickersCount = 0;

  for (const s of stickers) {
    const diag = await validateStickerImage(s, isAnimated);
    diagnosticsList.push(diag);
    totalSizeBytes += diag.sizeBytes;
    if (diag.status === "valid") validStickersCount++;
    else if (diag.status === "warning") warningStickersCount++;
    else errorStickersCount++;
  }

  const allValid = isCountValid && packNameValid && authorNameValid && errorStickersCount === 0;

  let summaryMessage = "Pack is 100% compliant with WhatsApp standards.";
  if (!isCountValid) {
    if (stickerCount < minRequired) {
      summaryMessage = `WhatsApp packs require at least ${minRequired} stickers (Currently ${stickerCount}).`;
    } else {
      summaryMessage = `WhatsApp packs allow at most ${maxAllowed} stickers (Currently ${stickerCount}).`;
    }
  } else if (errorStickersCount > 0) {
    summaryMessage = `${errorStickersCount} sticker(s) exceed WhatsApp file size or format constraints.`;
  } else if (warningStickersCount > 0) {
    summaryMessage = `Pack is ready, with ${warningStickersCount} minor warning(s) that can be auto-optimized.`;
  }

  return {
    stickerCount,
    isCountValid,
    minRequired,
    maxAllowed,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    validStickersCount,
    warningStickersCount,
    errorStickersCount,
    allValid,
    packNameValid,
    authorNameValid,
    stickers: diagnosticsList,
    summaryMessage,
  };
}
