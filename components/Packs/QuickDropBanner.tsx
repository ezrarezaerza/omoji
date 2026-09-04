"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  ImagePlus,
  Film,
  Layers,
  UploadCloud,
  PlusCircle,
  Clipboard,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface QuickDropBannerProps {
  onOpenEditor: (initialUrl?: string, file?: File) => void;
}

export type UploadType = "static" | "animated" | "batch";

export function QuickDropBanner({ onOpenEditor }: QuickDropBannerProps) {
  const [uploadMode, setUploadMode] = useState<UploadType>("static");
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
      setDragError("Please drop valid PNG, JPG, WebP, GIF, or MP4 files.");
      return;
    }
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      onOpenEditor(previewUrl, file);
    }
  };

  const acceptConfig =
    uploadMode === "animated"
      ? {
          "image/gif": [".gif"],
          "video/mp4": [".mp4"],
        }
      : {
          "image/png": [".png"],
          "image/jpeg": [".jpg", ".jpeg"],
          "image/webp": [".webp"],
          "image/gif": [".gif"],
          "video/mp4": [".mp4"],
        };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptConfig,
    maxSize: 25 * 1024 * 1024,
    multiple: false,
    noClick: false,
  });

  const handlePasteFromClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!navigator.clipboard?.read) {
        setDragError("Press Ctrl+V (or Cmd+V) to paste an image directly.");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          const previewUrl = URL.createObjectURL(file);
          onOpenEditor(previewUrl, file);
          return;
        }
      }
      setDragError("No image found in clipboard. Copy an image first, then paste.");
    } catch {
      setDragError("Press Ctrl+V (or Cmd+V) to paste an image directly.");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Direct Dropzone */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-['Space_Grotesk']">
                Quick Sticker Cutout & Editor
              </h3>
            </div>

            {/* Format Toggle Buttons */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setUploadMode("static")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  uploadMode === "static"
                    ? "bg-white dark:bg-[#182229] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ImagePlus className="h-3 w-3 text-[#25D366]" />
                <span>Static (PNG/JPG)</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode("animated")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  uploadMode === "animated"
                    ? "bg-white dark:bg-[#182229] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Film className="h-3 w-3 text-indigo-500" />
                <span>Animated GIF</span>
              </button>
            </div>
          </div>

          <div
            {...getRootProps()}
            id="quick-dropzone-box"
            className={`group relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
              isDragReject
                ? "border-rose-500 bg-rose-500/10 text-rose-500"
                : isDragActive
                ? "border-[#25D366] bg-emerald-500/15 scale-[1.005]"
                : "border-slate-300 dark:border-white/15 bg-slate-50/70 dark:bg-black/20 hover:border-emerald-500/60 hover:bg-emerald-500/5"
            }`}
          >
            <input {...getInputProps()} id="quick-file-input" />

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                {isDragActive ? (
                  <UploadCloud className="h-6 w-6 animate-bounce" />
                ) : uploadMode === "animated" ? (
                  <Film className="h-6 w-6" />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {isDragActive
                    ? "Release to open in Canvas Studio!"
                    : "Drop photo or click to isolate background"}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  AI neural cutout, white die-cut borders, and WhatsApp 512×512 WebP sizing.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#202c33] transition shadow-xs cursor-pointer active:scale-95"
              >
                <Clipboard className="h-3.5 w-3.5 text-[#25D366]" />
                <span>Paste (Ctrl+V)</span>
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2 text-xs font-bold shadow-xs transition group-hover:bg-[#25D366] group-hover:text-white">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Browse</span>
              </span>
            </div>
          </div>

          {dragError && (
            <div className="mt-2 text-xs font-bold text-rose-500 dark:text-rose-400">
              {dragError}
            </div>
          )}
        </div>

        {/* Right: Quick Studio Canvas Launcher */}
        <div className="lg:border-l lg:border-slate-200/80 lg:dark:border-white/10 lg:pl-5 flex flex-col justify-center shrink-0">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            Blank Canvas Mode
          </div>
          <button
            type="button"
            onClick={() => onOpenEditor()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#25D366] px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Open Studio Canvas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
