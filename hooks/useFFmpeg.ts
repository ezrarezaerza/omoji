"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export interface UseFFmpegReturn {
  ffmpeg: FFmpeg | null;
  isReady: boolean;
  isLoading: boolean;
  progress: number;
  error: string | null;
  loadFFmpeg: (timeoutMs?: number) => Promise<FFmpeg | null>;
}

const CORE_VERSION = "0.12.6";
const CDN_SOURCES = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
];

export function useFFmpeg(autoLoad: boolean = false): UseFFmpegReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadingPromiseRef = useRef<Promise<FFmpeg | null>>(null);

  const loadFFmpeg = useCallback(
    async (timeoutMs: number = 7000): Promise<FFmpeg | null> => {
      if (ffmpegRef.current && ffmpegRef.current.loaded) {
        setIsReady(true);
        setIsLoading(false);
        return ffmpegRef.current;
      }

      if (loadingPromiseRef.current) {
        return loadingPromiseRef.current;
      }

      setIsLoading(true);
      setError(null);

      const loadPromise = (async () => {
        // Create an overall timeout to prevent hanging forever
        let timeoutHandle: any;
        const timeoutPromise = new Promise<null>((resolve) => {
          timeoutHandle = setTimeout(() => {
            console.warn(`[useFFmpeg] Loading timed out after ${timeoutMs}ms. Using fast fallback.`);
            resolve(null);
          }, timeoutMs);
        });

        const executionPromise = (async (): Promise<FFmpeg | null> => {
          for (const baseUrl of CDN_SOURCES) {
            try {
              const ffmpeg = new FFmpeg();
              ffmpegRef.current = ffmpeg;

              ffmpeg.on("progress", ({ progress: p }) => {
                setProgress(Math.round(p * 100));
              });

              const coreURL = await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript");
              const wasmURL = await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm");

              await ffmpeg.load({
                coreURL,
                wasmURL,
              });

              setIsReady(true);
              setIsLoading(false);
              return ffmpeg;
            } catch (err) {
              console.warn(`[useFFmpeg] Failed loading from ${baseUrl}:`, err);
              // Try next CDN
            }
          }
          return null;
        })();

        try {
          const result = await Promise.race([executionPromise, timeoutPromise]);
          clearTimeout(timeoutHandle);

          if (result) {
            return result;
          } else {
            setError("FFmpeg WASM took too long or could not load. Fast fallback enabled.");
            setIsLoading(false);
            setIsReady(false);
            return null;
          }
        } catch (err: any) {
          clearTimeout(timeoutHandle);
          console.warn("[useFFmpeg] WebAssembly initialization error:", err);
          setError(err?.message || "WebAssembly engine unavailable.");
          setIsLoading(false);
          setIsReady(false);
          return null;
        } finally {
          loadingPromiseRef.current = null;
        }
      })();

      loadingPromiseRef.current = loadPromise;
      return loadPromise;
    },
    []
  );

  useEffect(() => {
    if (autoLoad && !isReady && !isLoading) {
      loadFFmpeg(6000);
    }
  }, [autoLoad, isReady, isLoading, loadFFmpeg]);

  return {
    ffmpeg: ffmpegRef.current,
    isReady,
    isLoading,
    progress,
    error,
    loadFFmpeg,
  };
}

export default useFFmpeg;
