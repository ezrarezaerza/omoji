import QRCode from "qrcode";
import { dataUrlToBlob } from "./exportSticker";
import { sanitizeAndTranscodeToWhatsAppWebP } from "./webpTranscoder";

export interface WebShareResult {
  success: boolean;
  method: "native-share" | "clipboard" | "direct-link" | "download";
  message: string;
}

/**
 * Checks if the current browser environment supports native file sharing (Web Share API Level 2)
 */
export function canWebShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File(["dummy"], "sticker.webp", { type: "image/webp" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Direct 1-Click Share to WhatsApp (or native mobile sharing sheet)
 */
export async function shareStickerToWhatsApp(
  source: Blob | string,
  options: {
    title?: string;
    text?: string;
    fileName?: string;
    format?: "webp" | "png";
  } = {}
): Promise<WebShareResult> {
  const {
    title = "WhatsApp Sticker",
    text = "Created with Sticker Studio AI",
    fileName = "whatsapp_sticker",
    format = "webp",
  } = options;

  let targetBlob: Blob;

  if (format === "webp") {
    const transcodeRes = await sanitizeAndTranscodeToWhatsAppWebP(source, {
      targetWidth: 512,
      targetHeight: 512,
      enforceSafetyMargin: true,
      marginPixels: 16,
      maxFileSizeKB: 98,
      format: "image/webp",
    });
    targetBlob = transcodeRes.blob;
  } else {
    const transcodeRes = await sanitizeAndTranscodeToWhatsAppWebP(source, {
      targetWidth: 512,
      targetHeight: 512,
      enforceSafetyMargin: true,
      marginPixels: 16,
      format: "image/png",
    });
    targetBlob = transcodeRes.blob;
  }

  const mimeType = format === "webp" ? "image/webp" : "image/png";
  const ext = format === "webp" ? ".webp" : ".png";
  const fullFileName = `${fileName.replace(/[^a-z0-9_-]/gi, "_")}${ext}`;

  // 1. Try Native Web Share API with Files
  if (canWebShareFiles()) {
    try {
      const file = new File([targetBlob], fullFileName, { type: mimeType });
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return {
        success: true,
        method: "native-share",
        message: "Sticker sent to sharing sheet!",
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          method: "native-share",
          message: "Share was cancelled.",
        };
      }
      console.warn("Native share failed, falling back to clipboard copy:", err);
    }
  }

  // 2. Fallback: Copy transparent image to system clipboard
  try {
    const clipResult = await copyStickerToClipboard(source);
    if (clipResult.success) {
      return {
        success: true,
        method: "clipboard",
        message: "Copied sticker to clipboard! Paste directly into WhatsApp Web or chat.",
      };
    }
  } catch {
    // Continue to download fallback
  }

  // 3. Fallback: Trigger direct file download
  const downloadUrl = URL.createObjectURL(targetBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  return {
    success: true,
    method: "download",
    message: `Downloaded ${fullFileName} to device. Drag & drop into WhatsApp!`,
  };
}

/**
 * Copies a transparent sticker to the OS clipboard as PNG (universal image format for clipboards)
 */
export async function copyStickerToClipboard(
  source: Blob | string
): Promise<{ success: boolean; message: string }> {
  if (typeof navigator === "undefined" || !navigator.clipboard || !window.ClipboardItem) {
    return {
      success: false,
      message: "Clipboard image copy is not supported in this browser.",
    };
  }

  try {
    // Generate clean PNG blob
    const transcodeRes = await sanitizeAndTranscodeToWhatsAppWebP(source, {
      targetWidth: 512,
      targetHeight: 512,
      enforceSafetyMargin: true,
      marginPixels: 16,
      format: "image/png",
    });

    const pngBlob = transcodeRes.blob;
    const item = new ClipboardItem({ "image/png": pngBlob });
    await navigator.clipboard.write([item]);

    return {
      success: true,
      message: "✨ Sticker copied to clipboard! Paste (Ctrl+V / ⌘+V) into WhatsApp Web.",
    };
  } catch (err: any) {
    console.error("Failed to copy sticker to clipboard:", err);
    return {
      success: false,
      message: err?.message || "Failed to copy image to clipboard.",
    };
  }
}

/**
 * Generates an instant mobile transfer QR code
 */
export async function generateTransferQrCode(
  data: string,
  options: { width?: number; margin?: number } = {}
): Promise<string> {
  const { width = 240, margin = 2 } = options;
  try {
    return await QRCode.toDataURL(data, {
      width,
      margin,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR Code generation failed:", err);
    return "";
  }
}

/**
 * Generates a WhatsApp Click-to-Chat / Direct Send URL
 */
export function createWhatsAppWebUrl(text?: string, phone?: string): string {
  const baseUrl = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}` : "https://wa.me/";
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `${baseUrl}${params}`;
}
