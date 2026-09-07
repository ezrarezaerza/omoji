"use client";

import React, { useState, useEffect } from "react";
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
  Flame,
  FileArchive,
  FileCode,
  ShieldCheck,
  Check,
  Smartphone,
  FolderDown,
  Info,
  Maximize2,
  Smile,
  RefreshCw,
  ExternalLink,
  Share2,
  Copy,
  QrCode,
  Film,
  Send,
} from "lucide-react";
import {
  exportWaStickersBundle,
  exportStandardZipBundle,
  exportSingleSticker,
  StickerItemExport,
} from "../../utils/packExporter";
import { handleStickerImageError } from "../../utils/imageHelper";
import {
  validateWhatsAppPack,
  WhatsAppPackDiagnostics,
  formatBytes,
} from "../../utils/whatsappValidator";
import {
  shareStickerToWhatsApp,
  copyStickerToClipboard,
  generateTransferQrCode,
  createWhatsAppWebUrl,
  canWebShareFiles,
} from "../../utils/whatsappTransfer";
import { createTrayIcon, dataUrlToBlob } from "../../utils/exportSticker";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  packName: string;
  authorName: string;
  stickers: (string | Blob)[];
  onPublishSuccess?: () => void;
  isAnimatedPack?: boolean;
}

const COMMON_EMOJIS = ["✨", "🔥", "😂", "😎", "❤️", "🚀", "🎉", "👍", "😍", "🥳", "🙌", "💯"];

export function ExportModal({
  isOpen,
  onClose,
  packName,
  authorName,
  stickers,
  onPublishSuccess,
  isAnimatedPack = false,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<
    "wastickers" | "direct-share" | "animated" | "zip" | "individual" | "publish"
  >(isAnimatedPack ? "animated" : "wastickers");

  const [autoOptimize, setAutoOptimize] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string>("");
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Diagnostic report state
  const [diagnostics, setDiagnostics] = useState<WhatsAppPackDiagnostics | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Emoji tags per sticker
  const [stickerEmojis, setStickerEmojis] = useState<Record<number, string[]>>({});

  // QR Code Transfer State
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [selectedStickerForShare, setSelectedStickerForShare] = useState<number>(0);

  const count = stickers.length;
  const supportsNativeShare = canWebShareFiles();

  // Run real-time diagnostics whenever modal opens or stickers change
  useEffect(() => {
    if (!isOpen || stickers.length === 0) return;

    let isMounted = true;
    setIsValidating(true);

    validateWhatsAppPack(stickers, packName, authorName, isAnimatedPack)
      .then((report) => {
        if (isMounted) {
          setDiagnostics(report);
          setIsValidating(false);
        }
      })
      .catch((err) => {
        console.error("Validation error:", err);
        if (isMounted) setIsValidating(false);
      });

    // Generate Mobile Transfer QR Code for this pack
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    generateTransferQrCode(currentUrl, { width: 200, margin: 2 }).then((url) => {
      if (isMounted) setQrDataUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, stickers, packName, authorName, isAnimatedPack]);

  const handleToggleEmoji = (index: number, emoji: string) => {
    setStickerEmojis((prev) => {
      const current = prev[index] || [];
      if (current.includes(emoji)) {
        return { ...prev, [index]: current.filter((e) => e !== emoji) };
      } else {
        if (current.length >= 3) {
          return { ...prev, [index]: [...current.slice(1), emoji] };
        }
        return { ...prev, [index]: [...current, emoji] };
      }
    });
  };

  const getStickerExportItems = (): StickerItemExport[] => {
    return stickers.map((source, index) => ({
      source,
      name: `sticker_${index + 1}`,
      emojis: stickerEmojis[index] && stickerEmojis[index].length > 0 ? stickerEmojis[index] : undefined,
    }));
  };

  // 1. Export as .wastickers (WhatsApp Native Format)
  const handleExportWaStickers = async (animatedOverride?: boolean) => {
    if (count === 0) {
      setError("Please add at least 1 sticker to export.");
      return;
    }
    setError(null);
    setSuccessNotice(null);
    setIsExporting(true);
    setExportProgress(5);

    try {
      const result = await exportWaStickersBundle({
        packName,
        authorName,
        stickers: getStickerExportItems(),
        animated: animatedOverride !== undefined ? animatedOverride : isAnimatedPack,
        autoOptimizeWebp: autoOptimize,
        onProgress: (step, percent) => {
          setExportStep(step);
          setExportProgress(percent);
        },
      });

      // Trigger browser download
      const downloadUrl = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSuccessNotice(
        `🎉 Downloaded "${result.filename}" (${formatBytes(result.sizeBytes)})! Open with WhatsApp or Sticker Maker.`
      );
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err?.message || "Failed to generate .wastickers package.");
    } finally {
      setIsExporting(false);
      setExportStep("");
      setExportProgress(0);
    }
  };

  // 2. Export as Full Standard .zip Bundle
  const handleExportZip = async () => {
    if (count === 0) {
      setError("Please add at least 1 sticker to export.");
      return;
    }
    setError(null);
    setSuccessNotice(null);
    setIsExporting(true);
    setExportProgress(5);

    try {
      const result = await exportStandardZipBundle({
        packName,
        authorName,
        stickers: getStickerExportItems(),
        animated: isAnimatedPack,
        autoOptimizeWebp: autoOptimize,
        onProgress: (step, percent) => {
          setExportStep(step);
          setExportProgress(percent);
        },
      });

      const downloadUrl = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSuccessNotice(
        `📦 Downloaded complete bundle "${result.filename}" (${formatBytes(result.sizeBytes)}) with WebP and high-res PNGs!`
      );
    } catch (err: any) {
      console.error("ZIP Export error:", err);
      setError(err?.message || "Failed to generate .zip bundle.");
    } finally {
      setIsExporting(false);
      setExportStep("");
      setExportProgress(0);
    }
  };

  // 3. Direct Share to WhatsApp / Mobile Sheet
  const handleDirectShare = async (index: number) => {
    const item = stickers[index];
    if (!item) return;

    setError(null);
    setSuccessNotice(null);

    const res = await shareStickerToWhatsApp(item, {
      title: `${packName} - Sticker #${index + 1}`,
      text: `Send from ${packName} on Sticker Studio AI`,
      fileName: `${packName}_sticker_${index + 1}`,
      format: "webp",
    });

    if (res.success) {
      setSuccessNotice(`✨ ${res.message}`);
    } else {
      setError(res.message);
    }
  };

  // 4. Copy to Clipboard
  const handleCopyClipboard = async (index: number) => {
    const item = stickers[index];
    if (!item) return;

    setError(null);
    setSuccessNotice(null);

    const res = await copyStickerToClipboard(item);
    if (res.success) {
      setSuccessNotice(res.message);
    } else {
      setError(res.message);
    }
  };

  // 5. Download Single Sticker
  const handleDownloadSingle = async (index: number, format: "webp" | "png") => {
    try {
      const item = stickers[index];
      const res = await exportSingleSticker(item, `${packName}_sticker_${index + 1}`, format);
      const downloadUrl = URL.createObjectURL(res.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Single download error:", err);
      setError("Failed to download sticker file.");
    }
  };

  // 6. Publish to Cloud Gallery
  const handlePublishToCloud = async () => {
    if (count === 0) {
      setError("Please add at least 1 sticker to share.");
      return;
    }
    setError(null);
    setSuccessNotice(null);
    setIsExporting(true);
    setExportProgress(10);

    try {
      setExportStep("Preparing 96x96 Tray Icon...");
      const trayBlob = await createTrayIcon(stickers[0], 96);
      setExportProgress(30);

      setExportStep("Transcoding sticker images...");
      const stickerBlobs: Blob[] = [];
      for (let i = 0; i < stickers.length; i++) {
        const item = stickers[i];
        if (typeof item === "string") {
          stickerBlobs.push(dataUrlToBlob(item));
        } else {
          stickerBlobs.push(item);
        }
        setExportProgress(30 + Math.round(((i + 1) / stickers.length) * 40));
      }

      setExportStep("Uploading pack to gallery...");
      const formData = new FormData();
      formData.append("packTitle", packName.trim() || "My Sticker Pack");
      formData.append("authorName", authorName.trim() || "Omoji Creator");
      formData.append("trayIcon", trayBlob, "tray_icon.png");

      stickerBlobs.forEach((blob, index) => {
        formData.append("stickers", blob, `sticker_${index + 1}.webp`);
      });

      const headers: Record<string, string> = {};
      try {
        const savedSession = localStorage.getItem("omoji_user_session");
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.id) {
            headers["x-user-id"] = parsed.id;
            headers["Authorization"] = `Bearer ${parsed.id}`;
          }
        }
      } catch (e) {}

      const response = await fetch("/api/packs", {
        method: "POST",
        headers,
        body: formData,
      });

      setExportStep("Finishing publish...");
      setExportProgress(95);
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
      setIsExporting(false);
      setExportStep("");
      setExportProgress(0);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>WhatsApp Sticker Exporter</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            512×512
          </span>
          {isAnimatedPack && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-500/30">
              Animated
            </span>
          )}
        </div>
      }
      description={`${packName || "Untitled Pack"} • by ${authorName || "Creator"} (${count}/30 Stickers)`}
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-lg shadow-emerald-500/25 font-black">
          <Package className="h-5 w-5" />
        </div>
      }
      maxWidthClass="max-w-3xl"
    >
      <div className="flex flex-col gap-4">
        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-black/10 dark:border-white/10 pb-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("wastickers")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "wastickers"
                ? "border-[#25D366] text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 rounded-xl"
                : "border-transparent text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Smartphone className="h-4 w-4 text-[#25D366]" />
            <span>.wastickers (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("direct-share")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "direct-share"
                ? "border-teal-500 text-teal-800 dark:text-teal-300 bg-teal-500/10 rounded-xl"
                : "border-transparent text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
              <Share2 className="h-4 w-4 text-teal-500" />
              <span>Direct Share & QR Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("animated")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "animated"
                  ? "border-amber-500 text-amber-800 dark:text-amber-300 bg-amber-500/10 rounded-t-xl"
                  : "border-transparent text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Film className="h-4 w-4 text-amber-500" />
              <span>Animated WebP Export</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("zip")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "zip"
                  ? "border-indigo-500 text-indigo-800 dark:text-indigo-300 bg-indigo-500/10 rounded-t-xl"
                  : "border-transparent text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileArchive className="h-4 w-4 text-indigo-500" />
              <span>Full .ZIP Archive</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "individual"
                  ? "border-cyan-500 text-cyan-800 dark:text-cyan-300 bg-cyan-500/10 rounded-t-xl"
                  : "border-transparent text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Smile className="h-4 w-4 text-cyan-500" />
              <span>Stickers & Emojis ({count})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("publish")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "publish"
                  ? "border-pink-500 text-pink-800 dark:text-pink-300 bg-pink-500/10 rounded-t-xl"
                  : "border-transparent text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Flame className="h-4 w-4 text-pink-500" />
              <span>Community Gallery</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* 1. WHATSAPP COMPLIANCE & SPEC DIAGNOSTICS BAR */}
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#25D366]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    WhatsApp Compliance Diagnostics
                  </span>
                </div>

                {isValidating ? (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-white/50">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                    Validating specs...
                  </span>
                ) : diagnostics ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
                      diagnostics.allValid
                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40"
                        : diagnostics.isCountValid
                        ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40"
                        : "bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {diagnostics.allValid ? "100% WhatsApp Ready" : diagnostics.summaryMessage}
                  </span>
                ) : null}
              </div>

              {/* 4 Mini Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Dimensions</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">512 × 512 px</span>
                  <span className="text-[9px] text-[#25D366] font-bold flex items-center gap-0.5 mt-0.5">
                    <Check className="h-2.5 w-2.5" /> Exact Standard
                  </span>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Weight Limit</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {diagnostics ? diagnostics.totalSizeFormatted : isAnimatedPack ? "< 500 KB / item" : "< 100 KB / item"}
                  </span>
                  <span className="text-[9px] text-[#25D366] font-bold flex items-center gap-0.5 mt-0.5">
                    <Check className="h-2.5 w-2.5" /> Auto-Optimized
                  </span>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Gutter Margin</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">16px Safe Buffer</span>
                  <span className="text-[9px] text-[#25D366] font-bold flex items-center gap-0.5 mt-0.5">
                    <Check className="h-2.5 w-2.5" /> Auto-Padded
                  </span>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Pack Count</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{count} / 30 Stickers</span>
                  <span
                    className={`text-[9px] font-bold flex items-center gap-0.5 mt-0.5 ${
                      count >= 3 ? "text-[#25D366]" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {count >= 3 ? <Check className="h-2.5 w-2.5" /> : <Info className="h-2.5 w-2.5" />}
                    {count >= 3 ? "Meets Min. (3)" : "Min. 3 required"}
                  </span>
                </div>
              </div>
            </div>

            {/* Error / Success Feedback Notifications */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-700 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successNotice && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Export Progress Bar */}
            {isExporting && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                    {exportStep || "Generating package..."}
                  </span>
                  <span className="font-mono font-bold text-[#25D366]">{exportProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/20 dark:bg-black/50">
                  <div
                    className="h-full bg-gradient-to-r from-[#25D366] via-emerald-400 to-teal-400 transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: .wastickers (WhatsApp Native Format) */}
            {activeTab === "wastickers" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-[#25D366] border border-emerald-500/30">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direct WhatsApp Package (.wastickers)</h3>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        Official bridge format for WhatsApp, Sticker Maker, and Android/iOS sticker importers.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 dark:bg-black/40 p-3 border border-black/10 dark:border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#25D366]" />
                      <span className="text-slate-800 dark:text-white/80 font-medium">Auto-compress to &lt; 100KB WhatsApp limit</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoOptimize((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoOptimize ? "bg-[#25D366]" : "bg-slate-300 dark:bg-white/20"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoOptimize ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleExportWaStickers(false)}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] py-3.5 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-emerald-500/25 hover:brightness-110 cursor-pointer"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Exporting .wastickers...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download .wastickers Pack ({count} Stickers)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Direct Share & QR Transfer Bridge */}
            {activeTab === "direct-share" && (
              <div className="space-y-5">
                {/* 1-Click Mobile Web Share & Clipboard Grid */}
                <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direct WhatsApp Transfer Pipeline</h3>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        Instantly dispatch stickers to WhatsApp chats, copy transparent PNGs to your clipboard, or scan to mobile.
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons for currently active sticker */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDirectShare(selectedStickerForShare)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] py-3 px-4 text-xs font-bold text-white transition shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{supportsNativeShare ? "Share Sticker to WhatsApp" : "Send / Download WebP"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyClipboard(selectedStickerForShare)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 py-3 px-4 text-xs font-bold text-slate-900 dark:text-white transition border border-black/10 dark:border-white/10 cursor-pointer"
                    >
                      <Copy className="h-4 w-4 text-cyan-500" />
                      <span>Copy Sticker to Clipboard (PNG)</span>
                    </button>
                  </div>
                </div>

                {/* Desktop-to-Mobile Handover QR Code Bento Section */}
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5 flex flex-col sm:flex-row items-center gap-5">
                  {qrDataUrl ? (
                    <div className="relative shrink-0 overflow-hidden rounded-2xl bg-white p-2.5 shadow-xl">
                      <img src={qrDataUrl} alt="Transfer QR Code" className="h-36 w-36 object-contain" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 py-0.5 text-center text-[9px] font-bold text-white">
                        Scan with Mobile Phone
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-400 dark:text-white/40">
                      <QrCode className="h-10 w-10 animate-pulse" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-500" />
                      <span>Mobile Transfer Bridge</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                      Scan this QR code with your iPhone or Android camera to open this sticker project directly on your phone and install it into WhatsApp with one tap.
                    </p>

                    <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <a
                        href={createWhatsAppWebUrl(`Check out my new sticker pack "${packName}" on Sticker Studio AI!`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open WhatsApp Web Chat</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Animated WebP Pack Exporter */}
            {activeTab === "animated" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <Film className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Animated Sticker Pack Exporter</h3>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        Packages animated stickers with strict WhatsApp specifications (max 500KB per sticker, 6-10 FPS, infinite loop).
                      </p>
                    </div>
                  </div>

                  {/* Animated spec parameters */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-white/70 dark:bg-black/40 p-2.5 border border-black/5 dark:border-white/5 text-center">
                      <span className="block text-[10px] text-slate-500 dark:text-white/50 font-bold">Max Size</span>
                      <span className="font-extrabold text-amber-700 dark:text-amber-300">&lt; 500 KB</span>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-black/40 p-2.5 border border-black/5 dark:border-white/5 text-center">
                      <span className="block text-[10px] text-slate-500 dark:text-white/50 font-bold">Frame Rate</span>
                      <span className="font-extrabold text-amber-700 dark:text-amber-300">8 - 12 FPS</span>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-black/40 p-2.5 border border-black/5 dark:border-white/5 text-center">
                      <span className="block text-[10px] text-slate-500 dark:text-white/50 font-bold">Loop Type</span>
                      <span className="font-extrabold text-amber-700 dark:text-amber-300">Infinite (0)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleExportWaStickers(true)}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 py-3.5 text-xs sm:text-sm font-bold text-slate-950 transition shadow-lg shadow-amber-500/25 cursor-pointer font-black"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                        <span>Exporting Animated Pack...</span>
                      </>
                    ) : (
                      <>
                        <Film className="h-4 w-4" />
                        <span>Download Animated .wastickers Pack ({count} Stickers)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Full .ZIP Archive */}
            {activeTab === "zip" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Universal Developer .ZIP Archive</h3>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        Contains organized folders with 512x512 WebP stickers, high-res PNG cutouts, 96x96 tray icon, and manifest.json.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-white/70">
                    <div className="rounded-xl bg-white/70 dark:bg-black/40 p-2.5 border border-black/5 dark:border-white/5">
                      📁 <span className="font-bold text-slate-900 dark:text-white">/webp_stickers</span> (512x512)
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-black/40 p-2.5 border border-black/5 dark:border-white/5">
                      📁 <span className="font-bold text-slate-900 dark:text-white">/png_high_res</span> (Alpha PNG)
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportZip}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 py-3.5 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-indigo-500/25 hover:brightness-110 cursor-pointer"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Creating ZIP bundle...</span>
                      </>
                    ) : (
                      <>
                        <FolderDown className="h-4 w-4" />
                        <span>Download Full .ZIP Bundle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: Individual Stickers & Emojis Grid */}
            {activeTab === "individual" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-white/60">
                  <span>Tag emojis to stickers for WhatsApp keyboard quick search:</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-300 font-bold">{count} Items</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {stickers.map((item, idx) => {
                    const previewUrl = typeof item === "string" ? item : URL.createObjectURL(item);
                    const currentEmojis = stickerEmojis[idx] || [];
                    const diag = diagnostics?.stickers[idx];

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-2xl border p-3 transition cursor-pointer ${
                          selectedStickerForShare === idx
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/40"
                        }`}
                        onClick={() => setSelectedStickerForShare(idx)}
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/60 flex items-center justify-center">
                          <img
                            src={previewUrl}
                            alt={`Sticker ${idx + 1}`}
                            className="h-full w-full object-contain"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleStickerImageError(e, previewUrl)}
                          />
                          <span className="absolute top-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              Sticker #{idx + 1}
                            </span>
                            {diag && (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-white/60">
                                {diag.sizeFormatted}
                              </span>
                            )}
                          </div>

                          {/* Emoji Tag Selector */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {COMMON_EMOJIS.slice(0, 6).map((emoji) => {
                              const isSelected = currentEmojis.includes(emoji);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEmoji(idx, emoji);
                                  }}
                                  className={`rounded px-1 text-xs transition cursor-pointer ${
                                    isSelected
                                      ? "bg-cyan-500 text-white scale-110 font-bold"
                                      : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick single actions */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectShare(idx);
                              }}
                              className="rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                            >
                              <Share2 className="h-2.5 w-2.5" />
                              Share
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyClipboard(idx);
                              }}
                              className="rounded-lg bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold hover:bg-cyan-500/30 transition cursor-pointer flex items-center gap-1"
                            >
                              <Copy className="h-2.5 w-2.5" />
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadSingle(idx, "webp");
                              }}
                              className="rounded-lg bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition cursor-pointer"
                            >
                              WebP
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: Publish to Community Gallery */}
            {activeTab === "publish" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Save & Share to Community Gallery</h3>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        Uploads your pack to your online account and publishes it to the trending discover feed.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handlePublishToCloud}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:brightness-110 py-3.5 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-pink-600/25 cursor-pointer"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Publishing to Gallery...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        <span>Publish Pack to Discover</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialog>
    );
  }

export default ExportModal;
