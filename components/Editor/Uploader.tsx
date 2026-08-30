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
        <div className="inline-flex rounded-2xl border-2 border-white/15 bg-black/40 p-1.5 backdrop-blur-2xl shadow-xl shadow-black/40">
          <button
            id="tab-dropzone-btn"
            type="button"
            onClick={() => setActiveTab("dropzone")}
            className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 ${
              activeTab === "dropzone"
                ? "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-lg shadow-orange-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FolderUp className="h-4 w-4" />
            <span>Drag & Drop</span>
          </button>

          <button
            id="tab-search-btn"
            type="button"
            onClick={() => setActiveTab("search")}
            className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 ${
              activeTab === "search"
                ? "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-lg shadow-orange-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Search Memes</span>
          </button>

          <button
            id="tab-url-btn"
            type="button"
            onClick={() => setActiveTab("url")}
            className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 ${
              activeTab === "url"
                ? "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-lg shadow-orange-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
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
          >
            <motion.div
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.992 }}
              onClick={rootProps.onClick}
              onKeyDown={rootProps.onKeyDown}
              onFocus={rootProps.onFocus}
              onBlur={rootProps.onBlur}
              tabIndex={rootProps.tabIndex}
              role={rootProps.role}
              className={`relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                isDragReject
                  ? "border-rose-500/60 bg-rose-500/10"
                  : isDragActive
                  ? "border-orange-400 bg-orange-500/15 shadow-[0_0_40px_rgba(249,115,22,0.28)]"
                  : "border-white/20 bg-white/[0.04] hover:bg-white/[0.07] hover:border-orange-500/40"
              }`}
            >
              <input {...getInputProps()} id="sticker-file-dropzone" />

              {/* Ambient Inner Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-orange-500/5 via-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Animated Center Graphic */}
              <motion.div
                animate={{
                  y: isDragActive ? -6 : 0,
                  scale: isDragActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-xl shadow-orange-500/30"
              >
                {isDragActive ? (
                  <UploadCloud className="h-10 w-10 animate-bounce" />
                ) : (
                  <ImagePlus className="h-9 w-9" />
                )}
              </motion.div>

              <h3 className="mt-5 text-xl sm:text-2xl font-black tracking-tight text-white font-['Space_Grotesk']">
                {isDragActive ? "Drop file to start crafting" : "Upload photo, GIF, or video"}
              </h3>

              <p className="mt-2 max-w-md text-xs sm:text-sm text-zinc-400">
                Drag & drop your media here, or click to browse. Turn static photos, memes, GIFs, or short clips into stickers.
              </p>

              {/* Feature & Format Badges Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                {/* Animated Stickers Badge */}
                <span
                  id="uploader-animated-pill"
                  className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3.5 py-1 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/30 font-bold"
                >
                  <Film className="h-3.5 w-3.5 text-pink-400 animate-pulse" />
                  <span>Animated Support (.GIF, .MP4)</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-orange-300">
                  <Sparkles className="h-3 w-3 text-orange-400" /> Automatic AI Cutout
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
                  <FileImage className="h-3 w-3 text-teal-400" /> WhatsApp Ready Format
                </span>
              </div>

              {dragError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-300"
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
