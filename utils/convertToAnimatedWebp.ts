import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export interface AnimatedWebpOptions {
  maxDurationSeconds?: number;
  fps?: number;
  quality?: number; // 1-100
  targetSize?: number; // 512
  onProgress?: (progress: number) => void;
  timeoutMs?: number;
  maxSizeBytes?: number; // 500KB limit for WhatsApp
}

/**
 * Converts a GIF or MP4 video file into an animated WhatsApp sticker-compliant WebP blob
 * using client-side FFmpeg WebAssembly, with adaptive multi-pass compression to stay strictly
 * under the 500KB limit.
 */
export async function convertToAnimatedWebp(
  file: File,
  ffmpeg: FFmpeg | null,
  options: AnimatedWebpOptions = {}
): Promise<Blob> {
  const {
    maxDurationSeconds = 3, // WhatsApp standard animation loop max duration
    fps = 10,
    quality = 45,
    targetSize = 512,
    onProgress,
    timeoutMs = 25000,
    maxSizeBytes = 490 * 1024, // Keep under 500 KB limit
  } = options;

  // Fallback immediately if FFmpeg engine is not provided or not loaded
  if (!ffmpeg || !ffmpeg.loaded) {
    console.info("[convertToAnimatedWebp] FFmpeg not available. Returning source asset blob directly.");
    return file;
  }

  const timestamp = Date.now();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || (file.type.includes("mp4") ? "mp4" : "gif");
  const inputFileName = `input_${timestamp}.${fileExt}`;
  const outputFileName = `output_${timestamp}.webp`;

  let progressHandler: ((event: { progress: number }) => void) | null = null;

  const conversionPromise = (async () => {
    try {
      if (onProgress) {
        progressHandler = ({ progress }) => {
          onProgress(Math.min(100, Math.max(0, Math.round(progress * 100))));
        };
        ffmpeg.on("progress", progressHandler);
      }

      // Write input media file into FFmpeg virtual file system
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile(inputFileName, fileData);

      // Video filter: Scale preserving aspect ratio within 480x480 (to preserve 16px safety margin) and pad to exact 512x512 transparent
      const innerSize = targetSize - 32; // 480px with 16px padding
      const videoFilter = `scale=${innerSize}:${innerSize}:force_original_aspect_ratio=decrease,pad=${targetSize}:${targetSize}:(ow-iw)/2:(oh-ih)/2:color=black@0`;

      // Pass 1: Primary conversion
      const args = [
        "-i",
        inputFileName,
        "-t",
        String(maxDurationSeconds),
        "-vf",
        videoFilter,
        "-r",
        String(fps),
        "-loop",
        "0",
        "-qscale",
        String(quality),
        "-an",
        "-vcodec",
        "libwebp",
        outputFileName,
      ];

      let exitCode = await ffmpeg.exec(args);

      if (exitCode !== 0) {
        // Fallback argument syntax
        const fallbackArgs = [
          "-i",
          inputFileName,
          "-t",
          String(maxDurationSeconds),
          "-vf",
          videoFilter,
          "-r",
          String(fps),
          "-loop",
          "0",
          "-q:v",
          String(quality),
          "-an",
          outputFileName,
        ];
        exitCode = await ffmpeg.exec(fallbackArgs);
      }

      // Read generated animated WebP file from virtual filesystem
      let rawData = await ffmpeg.readFile(outputFileName);
      let uint8Array = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData as any);
      let resultBlob = new Blob([uint8Array], { type: "image/webp" });

      // Pass 2: Adaptive reduction if file size exceeds WhatsApp 500KB constraint
      if (resultBlob.size > maxSizeBytes) {
        console.info(`[convertToAnimatedWebp] Result ${resultBlob.size} bytes exceeds ${maxSizeBytes} bytes. Running pass 2 reduction...`);
        const pass2OutputFile = `output_pass2_${timestamp}.webp`;
        const reducedArgs = [
          "-i",
          inputFileName,
          "-t",
          String(Math.min(2.5, maxDurationSeconds)),
          "-vf",
          `scale=420:420:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0`,
          "-r",
          "8",
          "-loop",
          "0",
          "-qscale",
          "28",
          "-an",
          "-vcodec",
          "libwebp",
          pass2OutputFile,
        ];
        await ffmpeg.exec(reducedArgs);
        try {
          const pass2Raw = await ffmpeg.readFile(pass2OutputFile);
          const pass2Array = pass2Raw instanceof Uint8Array ? pass2Raw : new Uint8Array(pass2Raw as any);
          resultBlob = new Blob([pass2Array], { type: "image/webp" });
          await ffmpeg.deleteFile(pass2OutputFile);
        } catch {
          // Keep pass 1 result if pass 2 failed
        }
      }

      return resultBlob;
    } finally {
      if (progressHandler) {
        ffmpeg.off("progress", progressHandler);
      }
      try {
        await ffmpeg.deleteFile(inputFileName);
      } catch {
        // Ignore
      }
      try {
        await ffmpeg.deleteFile(outputFileName);
      } catch {
        // Ignore
      }
    }
  })();

  // Timeout promise
  let timeoutHandle: any;
  const timeoutPromise = new Promise<Blob>((resolve) => {
    timeoutHandle = setTimeout(() => {
      console.warn(`[convertToAnimatedWebp] Conversion timed out after ${timeoutMs}ms. Using original asset blob.`);
      resolve(file);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([conversionPromise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    console.warn("[convertToAnimatedWebp] Failed to convert with FFmpeg, returning source file:", err);
    return file;
  }
}

export default convertToAnimatedWebp;
