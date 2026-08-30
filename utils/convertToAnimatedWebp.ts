import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export interface AnimatedWebpOptions {
  maxDurationSeconds?: number;
  fps?: number;
  quality?: number; // 1-100
  targetSize?: number; // 512
  onProgress?: (progress: number) => void;
  timeoutMs?: number;
}

/**
 * Converts a GIF or MP4 video file into an animated WhatsApp sticker-compliant WebP blob
 * using client-side FFmpeg WebAssembly, with graceful fallback to standard Blob.
 */
export async function convertToAnimatedWebp(
  file: File,
  ffmpeg: FFmpeg | null,
  options: AnimatedWebpOptions = {}
): Promise<Blob> {
  const {
    maxDurationSeconds = 6,
    fps = 12,
    quality = 50,
    targetSize = 512,
    onProgress,
    timeoutMs = 12000,
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

      // Video filter: Scale preserving aspect ratio and center crop to exact 512x512
      const videoFilter = `scale=${targetSize}:${targetSize}:force_original_aspect_ratio=increase,crop=${targetSize}:${targetSize}`;

      // Execute FFmpeg WebP encoding command
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

      const exitCode = await ffmpeg.exec(args);

      if (exitCode !== 0) {
        // Fallback with generic webp output
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
        const fallbackExitCode = await ffmpeg.exec(fallbackArgs);
        if (fallbackExitCode !== 0) {
          throw new Error(`FFmpeg conversion failed with exit code ${exitCode}`);
        }
      }

      // Read generated animated WebP file from virtual filesystem
      const rawData = await ffmpeg.readFile(outputFileName);
      const uint8Array = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData as any);

      return new Blob([uint8Array], { type: "image/webp" });
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
