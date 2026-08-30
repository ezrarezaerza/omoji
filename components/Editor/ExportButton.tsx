"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle2, AlertCircle, Sparkles, FolderArchive } from "lucide-react";
import { createWaStickersArchive } from "../../utils/createWaStickers";

export interface ExportButtonProps {
  packName?: string;
  authorName?: string;
  stickers: (Blob | string)[];
  trayIcon?: Blob | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  onExportSuccess?: (blob: Blob, fileName: string) => void;
  onExportError?: (error: Error) => void;
}

export function ExportButton({
  packName = "My Sticker Pack",
  authorName = "Sticker Studio Creator",
  stickers = [],
  trayIcon,
  className = "",
  size = "md",
  onExportSuccess,
  onExportError,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!stickers || stickers.length === 0) {
      setErrorMessage("Please create or add at least one sticker to export.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setIsExporting(true);
    setIsSuccess(false);
    setErrorMessage(null);
    setExportProgressText("Generating 96x96 Tray Icon...");

    try {
      await new Promise((r) => setTimeout(r, 200));
      setExportProgressText("Compressing 512x512 WebP Stickers...");

      // Execute packaging utility
      const wastickersBlob = await createWaStickersArchive({
        packName,
        authorName,
        stickers,
        trayIcon,
      });

      setExportProgressText("Finalizing .wastickers bundle...");
      await new Promise((r) => setTimeout(r, 200));

      // Create sanitized file name with .wastickers extension
      const safeName = packName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");
      const fileName = `${safeName || "sticker_pack"}.wastickers`;

      // Dynamically trigger native browser download
      const downloadUrl = URL.createObjectURL(wastickersBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up object URL after a small delay
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 5000);

      setIsSuccess(true);
      if (onExportSuccess) {
        onExportSuccess(wastickersBlob, fileName);
      }

      setTimeout(() => {
        setIsSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error("Failed to export WhatsApp sticker pack:", err);
      const errObj = err instanceof Error ? err : new Error(String(err));
      setErrorMessage(errObj.message || "Failed to create sticker pack.");
      if (onExportError) {
        onExportError(errObj);
      }
    } finally {
      setIsExporting(false);
      setExportProgressText("");
    }
  };

  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs rounded-xl",
    md: "px-5 py-2.5 text-xs sm:text-sm rounded-2xl",
    lg: "px-7 py-3.5 text-sm sm:text-base rounded-2xl",
  };

  return (
    <div className="relative inline-flex flex-col items-end">
      <motion.button
        id="export-wastickers-btn"
        type="button"
        disabled={isExporting}
        onClick={handleExport}
        whileHover={{ scale: isExporting ? 1 : 1.03 }}
        whileTap={{ scale: isExporting ? 1 : 0.97 }}
        className={`relative inline-flex items-center justify-center gap-2.5 font-extrabold tracking-tight transition-all duration-200 ${
          sizeClasses[size]
        } ${
          isSuccess
            ? "border border-emerald-500/40 bg-emerald-500 text-zinc-950 shadow-xl shadow-emerald-500/30"
            : "border border-orange-400/40 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40"
        } ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
            <span>{exportProgressText || "Exporting .wastickers..."}</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-zinc-950" />
            <span>Downloaded .wastickers!</span>
          </>
        ) : (
          <>
            <FolderArchive className="h-4 w-4 text-zinc-950" />
            <span>Export WhatsApp Pack (.wastickers)</span>
          </>
        )}
      </motion.button>

      {/* Floating Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full mt-2 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 shadow-xl backdrop-blur-md"
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExportButton;
