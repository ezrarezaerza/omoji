import Konva from "konva";

/**
 * Converts a base64 data URL to a binary Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/webp";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Exports a Konva Stage reference directly to a 512x512 WebP data URL and binary Blob.
 * WhatsApp requires sticker images to be exactly 512x512 pixels in WebP format with size < 100KB.
 */
export async function exportStageToWebP(
  stage: Konva.Stage | null,
  quality: number = 0.8
): Promise<{ dataUrl: string; blob: Blob } | null> {
  if (!stage) return null;

  // Render stage strictly at 1:1 pixel ratio (512x512 coordinate space)
  const dataUrl = stage.toDataURL({
    mimeType: "image/webp",
    quality,
    pixelRatio: 1,
    x: 0,
    y: 0,
    width: 512,
    height: 512,
  });

  const blob = dataUrlToBlob(dataUrl);

  return { dataUrl, blob };
}

/**
 * Resizes a 512x512 sticker image onto an off-screen HTML5 canvas to exactly 96x96 pixels,
 * returning a WebP/PNG Blob suitable as the WhatsApp pack tray icon (< 50KB).
 */
export async function createTrayIcon(
  source: Blob | string,
  targetSize: number = 96
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const objectUrl =
      typeof source === "string" ? source : URL.createObjectURL(source);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Unable to obtain 2D rendering context for tray icon.");
        }

        // High quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetSize, targetSize);

        // Export as WebP (or PNG fallback)
        canvas.toBlob(
          (blob) => {
            if (typeof source !== "string") {
              URL.revokeObjectURL(objectUrl);
            }
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to dataURL conversion
              const dataUrl = canvas.toDataURL("image/png");
              resolve(dataUrlToBlob(dataUrl));
            }
          },
          "image/png",
          0.9
        );
      } catch (err) {
        if (typeof source !== "string") {
          URL.revokeObjectURL(objectUrl);
        }
        reject(err);
      }
    };

    img.onerror = (e) => {
      if (typeof source !== "string") {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error(`Failed to load source image for tray icon: ${e}`));
    };

    img.src = objectUrl;
  });
}
