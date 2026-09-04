"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  UploadCloud,
  Sparkles,
  AlertCircle,
  FileImage,
  Film,
  Search,
  Link2,
  FolderUp,
  Clipboard,
} from "lucide-react";
import { MemeSearch } from "./MemeSearch";
import { UrlImporter } from "./UrlImporter";

export interface UploaderProps {
  onImageSelected: (imageUrl: string, file: File) => void;
  onAnimatedFileSelected?: (file: File) => void;
  onAssetUrlSelected?: (url: string) => Promise<void> | void;
  className?: string;
}

type TabType = "dropzone" | "search" | "url";

export function Uploader({
  onImageSelected,
  onAnimatedFileSelected,
  onAssetUrlSelected,
  className = "",
}: UploaderProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dropzone");
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);

    if (rejectedFiles && rejectedFiles.length > 0) {
      setDragError(
        "Please upload a valid static image (PNG, JPG, WEBP) or animated file (GIF, MP4) under 25MB."
      );
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const isAnimated = file.type === "image/gif" || file.type === "video/mp4";

      if (isAnimated) {
        if (onAnimatedFileSelected) {
          onAnimatedFileSelected(file);
        }
      } else {
        const previewUrl = URL.createObjectURL(file);
        onImageSelected(previewUrl, file);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/avif": [".avif"],
      "image/gif": [".gif"],
      "video/mp4": [".mp4"],
    },
    maxSize: 25 * 1024 * 1024,
    multiple: false,
  });

  const rootProps = getRootProps();

  return (
    <div className={`w-full flex flex-col space-y-6 ${className}`}>
      {/* Segmented Tab Bar: [ 📁 Drag & Drop | 🔍 Search Memes | 🔗 Import URL ] */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#182229] p-1.5 backdrop-blur-2xl shadow-sm">
          <button
            id="tab-dropzone-btn"
            type="button"
            onClick={() => setActiveTab("dropzone")}
            className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "dropzone"
                ? "bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-md shadow-emerald-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
            }`}
          >
            <FolderUp className="h-4 w-4" />
            <span>Drag & Drop</span>
          </button>

          <button
            id="tab-search-btn"
            type="button"
            onClick={() => setActiveTab("search")}
            className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "search"
                ? "bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-md shadow-emerald-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Search Memes</span>
          </button>

          <button
            id="tab-url-btn"
            type="button"
            onClick={() => setActiveTab("url")}
            className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "url"
                ? "bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-md shadow-emerald-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
            }`}
          >
            <Link2 className="h-4 w-4" />
            <span>Import URL</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        {activeTab === "dropzone" && (
          <motion.div
            key="tab-dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <motion.div
              whileHover={{ scale: 1.006 }}
              whileTap={{ scale: 0.994 }}
              onClick={rootProps.onClick}
              onKeyDown={rootProps.onKeyDown}
              onFocus={rootProps.onFocus}
              onBlur={rootProps.onBlur}
              tabIndex={rootProps.tabIndex}
              role={rootProps.role}
              className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                isDragReject
                  ? "border-rose-500 bg-rose-500/10 text-rose-500"
                  : isDragActive
                  ? "border-[#25D366] bg-emerald-500/15 shadow-[0_0_40px_rgba(37,211,102,0.25)]"
                  : "border-slate-300 dark:border-white/15 bg-white dark:bg-[#182229] hover:bg-slate-50 dark:hover:bg-[#202c33] hover:border-emerald-500/50"
              }`}
            >
              <input {...getInputProps()} id="sticker-file-dropzone" />

              {/* Animated Center Graphic */}
              <motion.div
                animate={{
                  y: isDragActive ? -6 : 0,
                  scale: isDragActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-xl shadow-emerald-500/25"
              >
                {isDragActive ? (
                  <UploadCloud className="h-9 w-9 animate-bounce" />
                ) : (
                  <ImagePlus className="h-9 w-9" />
                )}
              </motion.div>

              <h3 className="mt-5 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
                {isDragActive ? "Drop file to start crafting" : "Upload photo, meme, GIF or video"}
              </h3>

              <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                Drag & drop your media here, or click to browse. Automatically isolated with on-device AI.
              </p>

              {/* Feature & Format Badges Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                <span
                  id="uploader-animated-pill"
                  className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-800 dark:text-purple-300 font-bold"
                >
                  <Film className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Animated (.GIF, .MP4)</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-800 dark:text-emerald-300 font-bold">
                  <Sparkles className="h-3 w-3 text-[#25D366]" /> On-Device AI Cutout
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-teal-800 dark:text-teal-300 font-bold">
                  <FileImage className="h-3 w-3 text-teal-600 dark:text-teal-400" /> WhatsApp 512×512
                </span>
              </div>

              {dragError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{dragError}</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === "search" && (
          <motion.div
            key="tab-search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <MemeSearch
              onImageSelected={onImageSelected}
              onAnimatedFileSelected={onAnimatedFileSelected}
              onAssetUrlSelected={onAssetUrlSelected}
            />
          </motion.div>
        )}

        {activeTab === "url" && (
          <motion.div
            key="tab-url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <UrlImporter
              onImageSelected={onImageSelected}
              onAnimatedFileSelected={onAnimatedFileSelected}
              onAssetUrlSelected={onAssetUrlSelected}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Uploader;

