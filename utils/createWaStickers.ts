import JSZip from "jszip";
import { createTrayIcon, dataUrlToBlob } from "./exportSticker";

export interface CreateWaStickersOptions {
  packName: string;
  authorName: string;
  stickers: (Blob | string)[];
  trayIcon?: Blob | string;
  animated?: boolean;
}

export interface WaStickerMetadata {
  "android-play-store-link"?: string;
  "ios-app-store-link"?: string;
  name: string;
  publisher: string;
  "tray-image-file": string;
  "image-data-version": string;
  "avoid-cache": boolean;
  "animated-sticker-pack": boolean;
  stickers: Array<{
    "image-file": string;
    emojis?: string[];
  }>;
}

/**
 * Resolves a sticker source (Blob, dataURL, or object URL) into a binary Blob.
 */
async function resolveStickerBlob(source: Blob | string): Promise<Blob> {
  if (source instanceof Blob) {
    return source;
  }

  if (typeof source === "string") {
    if (source.startsWith("data:")) {
      return dataUrlToBlob(source);
    }
    if (source.startsWith("blob:") || source.startsWith("http://") || source.startsWith("https://")) {
      const response = await fetch(source);
      return await response.blob();
    }
    return dataUrlToBlob(source);
  }

  throw new Error("Invalid sticker source format");
}

/**
 * Packages an array of 512x512 WebP sticker images (static or animated) into a standard .wastickers
 * zip archive compatible with WhatsApp Sticker bridge apps (such as Sticker Maker,
 * Sticker.ly, and Android/iOS WhatsApp content providers).
 */
export async function createWaStickersArchive({
  packName = "Custom Pack",
  authorName = "Sticker Studio Creator",
  stickers,
  trayIcon,
  animated = false,
}: CreateWaStickersOptions): Promise<Blob> {
  if (!stickers || stickers.length === 0) {
    throw new Error("Cannot create sticker pack without at least one sticker.");
  }

  const zip = new JSZip();

  // 1. Process or generate 96x96 Tray Icon
  const firstSticker = stickers[0];
  const traySource = trayIcon || firstSticker;
  const trayBlob = await createTrayIcon(traySource, 96);

  // Bridge apps look for tray_icon.png and tray.png
  zip.file("tray_icon.png", trayBlob);
  zip.file("tray.png", trayBlob);

  // 2. Add plain text identification headers
  zip.file("title.txt", packName);
  zip.file("author.txt", authorName);

  // 3. Process and add each 512x512 sticker image file (static or animated WebP)
  const stickerMetadataList: Array<{ "image-file": string; emojis: string[] }> = [];
  const defaultEmojis = ["✨", "🔥", "😎", "😂", "🚀", "❤️", "👍", "🥳", "🎉", "👏"];

  let hasAnimatedStickers = animated;

  for (let index = 0; index < stickers.length; index++) {
    const rawSticker = stickers[index];
    const fileName = `${index + 1}.webp`;

    const stickerBlob = await resolveStickerBlob(rawSticker);

    // Add binary WebP directly to ZIP archive without altering compression or animation frames
    zip.file(fileName, stickerBlob);

    const emoji1 = defaultEmojis[index % defaultEmojis.length];
    const emoji2 = defaultEmojis[(index + 3) % defaultEmojis.length];

    stickerMetadataList.push({
      "image-file": fileName,
      emojis: [emoji1, emoji2],
    });
  }

  // 4. Generate metadata.json (Official WhatsApp Sticker pack manifest standard)
  const metadata: WaStickerMetadata = {
    name: packName,
    publisher: authorName,
    "tray-image-file": "tray_icon.png",
    "image-data-version": "1",
    "avoid-cache": false,
    "animated-sticker-pack": hasAnimatedStickers,
    stickers: stickerMetadataList,
  };

  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  // 5. Generate binary zip Blob with compression
  const wastickersBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
    mimeType: "application/zip",
  });

  return wastickersBlob;
}
