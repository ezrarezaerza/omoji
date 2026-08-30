"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Flame,
  Check,
  FileArchive,
} from "lucide-react";
import { createWaStickersArchive } from "../../utils/createWaStickers";
import { createTrayIcon, dataUrlToBlob } from "../../utils/exportSticker";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  packName: string;
  authorName: string;
  stickers: (string | Blob)[];
  onPublishSuccess?: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  packName,
  authorName,
  stickers,
  onPublishSuccess,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"download" | "publish">("download");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [downloadStep, setDownloadStep] = useState<string>("");
  const [publishStep, setPublishStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const count = stickers.length;
  const isMinimumReached = count >= 3;

  // 1. WhatsApp .wastickers Archive Download Handler
  const handleDownloadWaStickers = async () => {
    if (count === 0) {
      setError("Please add at least 1 sticker to export.");
      return;
    }
    setError(null);
    setSuccessNotice(null);
    setIsDownloading(true);

    try {
      setDownloadStep("1/3 Preparing pack icon...");
      await new Promise((r) => setTimeout(r, 200));

      setDownloadStep("2/3 Packaging stickers...");
      const zipBlob = await createWaStickersArchive({
        packName,
        authorName,
        stickers,
      });

      setDownloadStep("3/3 Getting download ready...");
      await new Promise((r) => setTimeout(r, 300));

      // Trigger standard browser download
      const sanitizedName = (packName || "whatsapp_pack")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");
      const filename = `${sanitizedName}.wastickers`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSuccessNotice(`🎉 Successfully downloaded "${filename}"! Ready to import directly into WhatsApp.`);
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err?.message || "Failed to generate sticker bundle.");
    } finally {
      setIsDownloading(false);
      setDownloadStep("");
    }
  };

  // 2. Publish to Trending & Cloud DB Handler
  const handlePublishToCloud = async () => {
    if (count === 0) {
      setError("Please add at least 1 sticker to share.");
      return;
    }
    setError(null);
    setSuccessNotice(null);
    setIsPublishing(true);

    try {
      setPublishStep("1/4 Preparing pack icon...");
      const trayBlob = await createTrayIcon(stickers[0], 96);

      setPublishStep("2/4 Preparing sticker images...");
      const stickerBlobs: Blob[] = [];
      for (const item of stickers) {
        if (typeof item === "string") {
          stickerBlobs.push(dataUrlToBlob(item));
        } else {
          stickerBlobs.push(item);
        }
      }

      setPublishStep("3/4 Uploading to cloud gallery...");
      const formData = new FormData();
      formData.append("packTitle", packName.trim() || "My Sticker Pack");
      formData.append("authorName", authorName.trim() || "Omoji Creator");
      formData.append("trayIcon", trayBlob, "tray_icon.png");

      stickerBlobs.forEach((blob, index) => {
        formData.append("stickers", blob, `sticker_${index + 1}.webp`);
      });

      const response = await fetch("/api/packs", {
        method: "POST",
        body: formData,
      });

      setPublishStep("4/4 Saving to community...");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || `Upload failed with HTTP ${response.status}`);
      }

      setSuccessNotice(`✨ Sticker pack "${packName}" is now published and saved to your account!`);
      if (onPublishSuccess) {
        onPublishSuccess();
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err?.message || "Failed to save pack to cloud.");
    } finally {
      setIsPublishing(false);
      setPublishStep("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay with noise blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#120f24] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-green-500 to-emerald-400 text-black shadow-lg shadow-green-500/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Export WhatsApp Sticker Pack
                </h2>
                <p className="text-xs text-white/50">
                  {packName} • by {authorName} ({count}/30 Stickers)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* WhatsApp Requirement Notice */}
            <div
              className={`flex items-start gap-3 rounded-2xl p-4 border text-xs leading-relaxed ${
                isMinimumReached
                  ? "bg-green-500/10 border-green-500/30 text-green-200"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-200"
              }`}
            >
              {isMinimumReached ? (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">
                  {isMinimumReached
                    ? "Ready for WhatsApp!"
                    : "Add at least 3 stickers for WhatsApp"}
                </span>
                <p className="mt-0.5 text-white/70">
                  WhatsApp packs require 3 to 30 stickers. Everything is formatted and sized automatically.
                </p>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-200">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successNotice && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* TWO LARGE BENTO TOGGLE CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* CARD 1: Download .wastickers */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab("download");
                  if (!isDownloading && !isPublishing) {
                    handleDownloadWaStickers();
                  }
                }}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all ${
                  activeTab === "download"
                    ? "border-green-500/50 bg-gradient-to-b from-green-950/40 to-black/60 shadow-xl shadow-green-950/50"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">
                    <FileArchive className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-green-300 border border-green-500/30">
                    Direct Download
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  Download Sticker Pack
                </h3>
                <p className="text-xs text-white/60 mb-4 leading-relaxed">
                  Downloads a ready-to-use sticker file (.wastickers) that opens instantly in WhatsApp or Sticker Maker.
                </p>

                <button
                  disabled={isDownloading || isPublishing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-green-600/30"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{downloadStep || "Preparing..."}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download for WhatsApp</span>
                    </>
                  )}
                </button>
              </motion.div>

              {/* CARD 2: Publish to Trending */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab("publish");
                  if (!isDownloading && !isPublishing) {
                    handlePublishToCloud();
                  }
                }}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all ${
                  activeTab === "publish"
                    ? "border-purple-500/50 bg-gradient-to-b from-purple-950/40 to-black/60 shadow-xl shadow-purple-950/50"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Flame className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple-300 border border-purple-500/30">
                    Online Gallery
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  Save & Share Online
                </h3>
                <p className="text-xs text-white/60 mb-4 leading-relaxed">
                  Saves your pack to your online account and shares it with friends or the community gallery.
                </p>

                <button
                  disabled={isDownloading || isPublishing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-purple-600/30"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{publishStep || "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>Save Online</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-black/40 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
