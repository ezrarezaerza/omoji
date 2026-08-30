"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, Loader2, CheckCircle2, AlertCircle, Sparkles, Database } from "lucide-react";
import { dataUrlToBlob, createTrayIcon } from "../../utils/exportSticker";

export interface PublishButtonProps {
  packTitle?: string;
  authorName?: string;
  stickers: (Blob | string)[];
  trayIcon?: Blob | string;
  userId?: string | null;
  className?: string;
  onPublishSuccess?: (pack: any) => void;
  onPublishError?: (error: string) => void;
}

export function PublishButton({
  packTitle = "My WhatsApp Sticker Pack",
  authorName = "Sticker Creator",
  stickers = [],
  trayIcon,
  userId = null,
  className = "",
  onPublishSuccess,
  onPublishError,
}: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!stickers || stickers.length === 0) {
      setErrorMessage("Add at least one sticker to publish your pack.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessInfo(null);
    setProgressStep("Generating 96x96 Tray Icon...");

    try {
      // 1. Build FormData payload
      const formData = new FormData();
      formData.append("packTitle", packTitle.trim() || "Untitled Pack");
      formData.append("authorName", authorName.trim() || "Sticker Creator");

      // Process tray icon
      const firstSticker = stickers[0];
      const traySource = trayIcon || firstSticker;
      const trayBlob = await createTrayIcon(traySource, 96);
      formData.append("trayIcon", trayBlob, "tray_icon.png");

      setProgressStep("Converting 512x512 WebP Assets...");
      await new Promise((r) => setTimeout(r, 200));

      // Append all sticker WebP blobs
      for (let i = 0; i < stickers.length; i++) {
        const item = stickers[i];
        let stickerBlob: Blob;
        if (typeof item === "string") {
          stickerBlob = dataUrlToBlob(item);
        } else {
          stickerBlob = item;
        }
        formData.append("stickers", stickerBlob, `sticker_${i + 1}.webp`);
      }

      setProgressStep("Uploading to Vercel Blob Storage & Prisma DB...");

      // 2. Post to /api/packs
      const headers: Record<string, string> = {};
      if (userId) {
        headers["x-user-id"] = userId;
        headers["Authorization"] = `Bearer ${userId}`;
      }

      const response = await fetch("/api/packs", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish sticker pack.");
      }

      setSuccessInfo("🎉 Pack published to Vercel Blob & Database!");
      if (onPublishSuccess) {
        onPublishSuccess(data.pack);
      }

      setTimeout(() => {
        setSuccessInfo(null);
      }, 5000);
    } catch (err: any) {
      console.error("Publishing error:", err);
      const msg = err.message || "Failed to publish pack.";
      setErrorMessage(msg);
      if (onPublishError) {
        onPublishError(msg);
      }
      setTimeout(() => setErrorMessage(null), 4500);
    } finally {
      setIsPublishing(false);
      setProgressStep("");
    }
  };

  return (
    <div className="relative inline-flex flex-col items-end">
      <motion.button
        id="publish-pack-btn"
        type="button"
        disabled={isPublishing}
        onClick={handlePublish}
        whileHover={{ scale: isPublishing ? 1 : 1.02 }}
        whileTap={{ scale: isPublishing ? 1 : 0.98 }}
        className={`relative inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-2.5 text-xs sm:text-sm font-extrabold tracking-tight transition-all duration-300 ${
          successInfo
            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-xl shadow-emerald-500/20"
            : "border-purple-400/40 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:border-purple-300/60"
        } ${className}`}
      >
        {isPublishing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
            <span className="text-xs">{progressStep || "Publishing to Vercel Blob..."}</span>
          </>
        ) : successInfo ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Pack Published!</span>
          </>
        ) : (
          <>
            <CloudUpload className="h-4 w-4 text-purple-300" />
            <span>Publish to Vercel Blob & DB</span>
          </>
        )}
      </motion.button>

      {/* Floating Status / Error Popover */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute top-full mt-2 z-30 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/90 px-3.5 py-2 text-xs font-semibold text-rose-200 shadow-2xl backdrop-blur-xl"
          >
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {successInfo && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute top-full mt-2 z-30 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-3.5 py-2 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-xl"
          >
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successInfo}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PublishButton;
