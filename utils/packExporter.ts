import JSZip from "jszip";
import { generateWhatsAppTrayIcon, sanitizeAndTranscodeToWhatsAppWebP } from "./webpTranscoder";
import { dataUrlToBlob } from "./exportSticker";
import { validateWhatsAppPack, WhatsAppPackDiagnostics } from "./whatsappValidator";

export interface StickerItemExport {
  id?: string;
  source: Blob | string;
  emojis?: string[];
  name?: string;
}

export interface PackExportConfig {
  packName: string;
  authorName: string;
  stickers: (Blob | string | StickerItemExport)[];
  trayIcon?: Blob | string;
  animated?: boolean;
  autoOptimizeWebp?: boolean;
  onProgress?: (step: string, percent: number) => void;
}

export interface UniversalExportResult {
  blob: Blob;
  filename: string;
  format: "wastickers" | "zip" | "webp" | "png" | "json";
  sizeBytes: number;
  diagnostics: WhatsAppPackDiagnostics;
}

const DEFAULT_EMOJIS_BANK = [
  "✨", "🔥", "😎", "😂", "🚀", "❤️", "👍", "🥳", "🎉", "👏",
  "🙌", "⭐", "😍", "🤩", "💯", "🤙", "✌️", "💪", "💡", "🎯"
];

/**
 * Normalizes input sticker objects
 */
function normalizeStickerItem(
  item: Blob | string | StickerItemExport,
  index: number
): { source: Blob | string; emojis: string[]; name: string } {
  if (typeof item === "string" || item instanceof Blob) {
    const e1 = DEFAULT_EMOJIS_BANK[index % DEFAULT_EMOJIS_BANK.length];
    const e2 = DEFAULT_EMOJIS_BANK[(index + 3) % DEFAULT_EMOJIS_BANK.length];
    return {
      source: item,
      emojis: [e1, e2],
      name: `sticker_${index + 1}`,
    };
  }

  const defaultE1 = DEFAULT_EMOJIS_BANK[index % DEFAULT_EMOJIS_BANK.length];
  return {
    source: item.source,
    emojis: item.emojis && item.emojis.length > 0 ? item.emojis : [defaultE1],
    name: item.name || `sticker_${index + 1}`,
  };
}

/**
 * Generates an official WhatsApp .wastickers package
 */
export async function exportWaStickersBundle(
  config: PackExportConfig
): Promise<UniversalExportResult> {
  const {
    packName = "WhatsApp Pack",
    authorName = "Sticker Studio",
    stickers,
    trayIcon,
    animated = false,
    autoOptimizeWebp = true,
    onProgress,
  } = config;

  if (!stickers || stickers.length === 0) {
    throw new Error("Cannot create a sticker pack with 0 stickers.");
  }

  const zip = new JSZip();
  const total = stickers.length;

  onProgress?.("Creating WhatsApp Tray Icon (96x96)...", 10);
  const firstItem = normalizeStickerItem(stickers[0], 0);
  const traySource = trayIcon || firstItem.source;
  const trayResult = await generateWhatsAppTrayIcon(traySource, { size: 96, margin: 8 });

  zip.file("tray_icon.png", trayResult.blob);
  zip.file("tray.png", trayResult.blob);
  zip.file("title.txt", packName);
  zip.file("author.txt", authorName);

  const rawStickerBlobs: Blob[] = [];
  const processedWebpBlobs: Blob[] = [];
  const metadataStickerList: Array<{ "image-file": string; emojis: string[] }> = [];

  for (let i = 0; i < total; i++) {
    const item = normalizeStickerItem(stickers[i], i);
    const fileName = `${i + 1}.webp`;
    const progressPercent = Math.round(15 + ((i + 1) / total) * 65);

    onProgress?.(`Processing & optimizing sticker ${i + 1} of ${total}...`, progressPercent);

    let finalWebpBlob: Blob;

    if (autoOptimizeWebp) {
      const transcodeRes = await sanitizeAndTranscodeToWhatsAppWebP(item.source, {
        targetWidth: 512,
        targetHeight: 512,
        enforceSafetyMargin: true,
        marginPixels: 16,
        maxFileSizeKB: animated ? 490 : 98,
        format: "image/webp",
      });
      finalWebpBlob = transcodeRes.blob;
    } else {
      if (item.source instanceof Blob) {
        finalWebpBlob = item.source;
      } else if (typeof item.source === "string" && item.source.startsWith("data:")) {
        finalWebpBlob = dataUrlToBlob(item.source);
      } else {
        const transcodeRes = await sanitizeAndTranscodeToWhatsAppWebP(item.source);
        finalWebpBlob = transcodeRes.blob;
      }
    }

    rawStickerBlobs.push(finalWebpBlob);
    processedWebpBlobs.push(finalWebpBlob);
    zip.file(fileName, finalWebpBlob);

    metadataStickerList.push({
      "image-file": fileName,
      emojis: item.emojis.slice(0, 3), // WhatsApp max 3 emojis per sticker
    });
  }

  onProgress?.("Writing WhatsApp manifest metadata...", 85);
  const metadata = {
    name: packName,
    publisher: authorName,
    "tray-image-file": "tray_icon.png",
    "image-data-version": "1",
    "avoid-cache": false,
    "animated-sticker-pack": animated,
    stickers: metadataStickerList,
  };

  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  onProgress?.("Compacting .wastickers archive...", 95);
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType: "application/zip",
  });

  const sanitizedPackName = (packName || "whatsapp_pack")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `${sanitizedPackName}.wastickers`;

  const diagnostics = await validateWhatsAppPack(processedWebpBlobs, packName, authorName, animated);

  onProgress?.("Export completed!", 100);

  return {
    blob: zipBlob,
    filename,
    format: "wastickers",
    sizeBytes: zipBlob.size,
    diagnostics,
  };
}

/**
 * Generates a full standard .zip archive containing WebP stickers, PNG fallbacks, tray icon, and documentation
 */
export async function exportStandardZipBundle(
  config: PackExportConfig
): Promise<UniversalExportResult> {
  const {
    packName = "WhatsApp Pack",
    authorName = "Sticker Studio",
    stickers,
    trayIcon,
    animated = false,
    autoOptimizeWebp = true,
    onProgress,
  } = config;

  const zip = new JSZip();
  const total = stickers.length;

  onProgress?.("Preparing ZIP structure & Tray Icon...", 10);
  const firstItem = normalizeStickerItem(stickers[0], 0);
  const traySource = trayIcon || firstItem.source;
  const trayResult = await generateWhatsAppTrayIcon(traySource, { size: 96, margin: 8 });

  zip.file("tray_icon.png", trayResult.blob);

  const webpFolder = zip.folder("webp_stickers");
  const pngFolder = zip.folder("png_high_res");

  const processedWebpBlobs: Blob[] = [];
  const manifestItems: any[] = [];

  for (let i = 0; i < total; i++) {
    const item = normalizeStickerItem(stickers[i], i);
    const baseName = `sticker_${String(i + 1).padStart(2, "0")}`;
    const progressPercent = Math.round(15 + ((i + 1) / total) * 65);

    onProgress?.(`Rendering WebP & PNG for sticker ${i + 1}/${total}...`, progressPercent);

    // 1. WebP format
    const webpRes = await sanitizeAndTranscodeToWhatsAppWebP(item.source, {
      targetWidth: 512,
      targetHeight: 512,
      enforceSafetyMargin: true,
      marginPixels: 16,
      maxFileSizeKB: animated ? 490 : 98,
      format: "image/webp",
    });
    webpFolder?.file(`${baseName}.webp`, webpRes.blob);
    processedWebpBlobs.push(webpRes.blob);

    // 2. PNG high-res fallback
    const pngRes = await sanitizeAndTranscodeToWhatsAppWebP(item.source, {
      targetWidth: 512,
      targetHeight: 512,
      enforceSafetyMargin: true,
      marginPixels: 16,
      format: "image/png",
    });
    pngFolder?.file(`${baseName}.png`, pngRes.blob);

    manifestItems.push({
      index: i + 1,
      fileNameWebp: `${baseName}.webp`,
      fileNamePng: `${baseName}.png`,
      sizeBytesWebp: webpRes.sizeBytes,
      emojis: item.emojis,
      qualityScore: webpRes.diagnostics.qualityScore,
    });
  }

  // Add documentation README
  const readmeText = `# ${packName}
Author: ${authorName}
Total Stickers: ${total}
Generated by Sticker Studio AI / Omoji Studio

## Contents:
- /webp_stickers : Official WhatsApp 512x512 transparent WebP stickers (<100KB each).
- /png_high_res  : High-resolution PNG cutouts with alpha transparency.
- tray_icon.png  : 96x96 px pack thumbnail.
- manifest.json  : Metadata and emoji indexing.

## How to Import to WhatsApp:
1. Transfer the .webp stickers or rename the pack to .wastickers.
2. Open with WhatsApp, Sticker Maker, or Sticker.ly.
3. Tap "Add to WhatsApp" to install into your keyboard!
`;

  zip.file("README.md", readmeText);
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        packName,
        author: authorName,
        stickerCount: total,
        animated,
        stickers: manifestItems,
      },
      null,
      2
    )
  );

  onProgress?.("Compressing complete archive...", 90);
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType: "application/zip",
  });

  const sanitizedPackName = (packName || "sticker_pack")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `${sanitizedPackName}_complete_bundle.zip`;

  const diagnostics = await validateWhatsAppPack(processedWebpBlobs, packName, authorName, animated);

  onProgress?.("Export completed!", 100);

  return {
    blob: zipBlob,
    filename,
    format: "zip",
    sizeBytes: zipBlob.size,
    diagnostics,
  };
}

/**
 * Downloads a single sticker as 512x512 WebP or PNG
 */
export async function exportSingleSticker(
  source: Blob | string,
  fileName: string = "sticker",
  format: "webp" | "png" = "webp"
): Promise<{ blob: Blob; filename: string }> {
  const mime = format === "webp" ? "image/webp" : "image/png";
  const ext = format === "webp" ? ".webp" : ".png";

  const res = await sanitizeAndTranscodeToWhatsAppWebP(source, {
    targetWidth: 512,
    targetHeight: 512,
    enforceSafetyMargin: true,
    marginPixels: 16,
    format: mime,
    maxFileSizeKB: format === "webp" ? 98 : 500,
  });

  const sanitizedName = fileName.replace(/[^a-z0-9_-]/gi, "_");
  const finalFilename = `${sanitizedName}${ext}`;

  return {
    blob: res.blob,
    filename: finalFilename,
  };
}
