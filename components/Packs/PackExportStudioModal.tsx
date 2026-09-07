"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  FolderArchive,
  Share2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  QrCode,
  FileCode,
  Layers,
  Smile,
  ShieldCheck,
  Check,
  Send,
  ExternalLink,
  Package,
  Copy,
  Smartphone,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord, StickerRecord } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import {
  exportWaStickersBundle,
  exportStandardZipBundle,
  exportSingleSticker,
  UniversalExportResult,
} from "../../utils/packExporter";
import {
  shareStickerToWhatsApp,
  copyStickerToClipboard,
  generateTransferQrCode,
  canWebShareFiles,
} from "../../utils/whatsappTransfer";
import { formatBytes } from "../../utils/whatsappValidator";
import { WhatsAppHandoffModal } from "./WhatsAppHandoffModal";
import { handleStickerImageError } from "../../utils/imageHelper";

interface PackExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: StickerPackRecord;
}

export function PackExportStudioModal({
  isOpen,
  onClose,
  pack,
}: PackExportStudioModalProps) {
  const [activeTab, setActiveTab] = useState<
    "wastickers" | "direct-share" | "zip" | "json" | "preview"
  >("wastickers");

  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string>("");
  const [exportPercent, setExportPercent] = useState<number>(0);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Selected sticker for single direct share
  const [selectedStickerIndex, setSelectedStickerIndex] = useState(0);
  const [chatBgTheme, setChatBgTheme] = useState<"light" | "dark">("light");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const stickers = pack.stickers || [];
  const occupiedCount = stickers.length;
  const isAnimated = stickers.some((s) => s.isAnimated);

  useEffect(() => {
    if (isOpen) {
      generateTransferQrCode(pack.title)
        .then((url) => setQrCodeDataUrl(url))
        .catch((e) => console.warn("QR code gen error:", e));
    }
  }, [isOpen, pack.title]);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Export .wastickers bundle
  const handleExportWastickers = async () => {
    if (occupiedCount < 3) {
      showToast("WhatsApp requires at least 3 stickers to export a pack.", true);
      return;
    }

    setIsExporting(true);
    setExportStep("Preparing stickers for WhatsApp packaging...");
    setExportPercent(5);

    try {
      const items = stickers.map((s, idx) => ({
        source: s.imageUrl,
        emojis: s.emojis || ["✨"],
        name: `sticker_${(s.slotIndex ?? idx) + 1}`,
      }));

      const res: UniversalExportResult = await exportWaStickersBundle({
        packName: pack.title,
        authorName: pack.publisher || "Omoji Creator",
        stickers: items,
        trayIcon: pack.trayIconUrl,
        animated: isAnimated,
        autoOptimizeWebp: autoOptimize,
        onProgress: (step, percent) => {
          setExportStep(step);
          setExportPercent(percent);
        },
      });

      const blobUrl = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      showToast(`✨ Downloaded "${res.filename}" (${formatBytes(res.sizeBytes)})!`);
    } catch (err: any) {
      console.error("Export .wastickers error:", err);
      showToast(err.message || "Failed to generate .wastickers file.", true);
    } finally {
      setIsExporting(false);
      setExportStep("");
    }
  };

  // Export Standard ZIP Bundle
  const handleExportZip = async (format: "webp" | "png" = "webp") => {
    if (occupiedCount === 0) {
      showToast("No stickers to export in this pack.", true);
      return;
    }

    setIsExporting(true);
    setExportStep(`Packaging ${occupiedCount} stickers into standard .zip...`);
    setExportPercent(20);

    try {
      const items = stickers.map((s, idx) => ({
        source: s.imageUrl,
        emojis: s.emojis || ["✨"],
        name: `sticker_${(s.slotIndex ?? idx) + 1}`,
      }));

      const res = await exportStandardZipBundle({
        packName: pack.title,
        authorName: pack.publisher || "Omoji Creator",
        stickers: items,
        onProgress: (step, percent) => {
          setExportStep(step);
          setExportPercent(percent);
        },
      });

      const blobUrl = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      showToast(`✨ Downloaded "${res.filename}"!`);
    } catch (err: any) {
      console.error("ZIP Export error:", err);
      showToast(err.message || "Failed to generate ZIP archive.", true);
    } finally {
      setIsExporting(false);
      setExportStep("");
    }
  };

  // Export Single JSON Backup
  const handleExportJson = () => {
    const backupData = {
      version: 1,
      format: "omoji-sticker-pack-backup",
      pack: {
        id: pack.id,
        title: pack.title,
        publisher: pack.publisher,
        trayIconUrl: pack.trayIconUrl,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
      },
      stickers: pack.stickers,
      exportedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    const safeTitle = (pack.title || "pack").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    a.download = `${safeTitle}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    showToast("✨ Downloaded JSON pack manifest backup!");
  };

  // Direct Share active sticker
  const handleShareCurrentSticker = async () => {
    const sticker = stickers[selectedStickerIndex];
    if (!sticker) return;

    try {
      showToast("Preparing sticker for sharing...");
      const result = await shareStickerToWhatsApp(sticker.imageUrl, {
        title: `${pack.title} Sticker`,
        text: `Check out this sticker from ${pack.title}!`,
      });

      if (result.method === "native-share") {
        showToast("Opened sharing dialog!");
      } else if (result.method === "download") {
        showToast("Saved sticker image to your downloads.");
      } else if (result.method === "clipboard") {
        showToast("Copied sticker image to clipboard!");
      } else {
        showToast("Sticker opened in new tab.");
      }
    } catch (err: any) {
      console.error("Share error:", err);
      showToast(err.message || "Could not share sticker.", true);
    }
  };

  // Copy sticker image to clipboard
  const handleCopySticker = async () => {
    const sticker = stickers[selectedStickerIndex];
    if (!sticker) return;

    try {
      const success = await copyStickerToClipboard(sticker.imageUrl);
      if (success) {
        showToast("✨ Copied sticker PNG to clipboard! You can paste it directly into WhatsApp Web or Telegram.");
      } else {
        showToast("Clipboard copy not supported by your browser; use Download instead.", true);
      }
    } catch (err) {
      showToast("Could not copy to clipboard.", true);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Export WhatsApp Pack</span>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-black text-[#25D366] border border-emerald-500/20">
            {occupiedCount}/30 Stickers
          </span>
        </div>
      }
      description={`${pack.title} by ${pack.publisher || "Omoji Creator"}`}
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-[#25D366] text-white shadow-md shadow-emerald-500/20">
          <FolderArchive className="h-5 w-5" />
        </div>
      }
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4 font-sans">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("wastickers")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "wastickers"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>.WASTICKERS (Official)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Chat Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("direct-share")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "direct-share"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10"
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>Direct Share & Web</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("zip")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "zip"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10"
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            <span>ZIP Bundle (WebP/PNG)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("json")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "json"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10"
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>JSON Backup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Toast Notification */}
          <AnimatePresence>
            {successToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
                <span>{successToast}</span>
              </motion.div>
            )}
            {errorToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-bold text-red-800 dark:text-red-300"
              >
                <X className="h-4 w-4 text-red-500 shrink-0" />
                <span>{errorToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: WASTICKERS */}
          {activeTab === "wastickers" && (
            <div className="space-y-6">
              {/* Packaging Status / Progress */}
              {isExporting ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 text-center space-y-4">
                  <RefreshCw className="h-9 w-9 text-[#25D366] animate-spin" />
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Compiling WhatsApp Sticker Pack
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {exportStep}
                    </p>
                  </div>
                  <div className="w-full max-w-md h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-[#25D366] transition-all duration-300 rounded-full"
                      style={{ width: `${exportPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {exportPercent}% Complete
                  </span>
                </div>
              ) : (
                <>
                  {/* Hero Bento Banner */}
                  <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-2 max-w-lg">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/20 px-3 py-1 text-[11px] font-black text-[#25D366] border border-[#25D366]/30">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Standard WhatsApp Format</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                          Download WhatsApp `.wastickers`
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Generates a single-file archive compatible with WhatsApp on Android (Sticker Maker / Personal Stickers) and iOS apps, containing 512x512 WebP cutouts, 96x96 tray icon, and metadata manifest.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsHandoffOpen(true)}
                          disabled={occupiedCount < 3}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-xs font-black text-black shadow-xl shadow-emerald-600/30 hover:bg-[#20bd5a] active:scale-95 transition-all disabled:opacity-40 cursor-pointer w-full sm:w-auto font-['Space_Grotesk']"
                        >
                          <Smartphone className="h-4 w-4 stroke-[2.5]" />
                          <span>1-Tap Add to WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportWastickers}
                          disabled={occupiedCount < 3}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-white/80 dark:bg-zinc-900/80 px-5 py-3.5 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-sm hover:bg-emerald-500/10 active:scale-95 transition-all disabled:opacity-40 cursor-pointer w-full sm:w-auto"
                        >
                          <Download className="h-4 w-4 stroke-[2.5]" />
                          <span>Download .wastickers</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Settings & Optimization Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4">
                      <input
                        type="checkbox"
                        id="auto-optimize-opt"
                        checked={autoOptimize}
                        onChange={(e) => setAutoOptimize(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#25D366] focus:ring-[#25D366]"
                      />
                      <label htmlFor="auto-optimize-opt" className="text-xs cursor-pointer">
                        <span className="font-black text-slate-900 dark:text-white block">
                          Auto-Enforce 16px Safe Gutter & Compression
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                          Ensures every cutout stays strictly within WhatsApp&apos;s 100 KB limit and maintains safe margin buffers.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-[#25D366]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          WhatsApp Ready Tray Icon (96x96)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {pack.trayIconUrl ? "Custom pack icon used" : "Auto-extracted from Slot #1"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* How to Install Guide Accordion */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/5 p-5 space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      How to import .wastickers into WhatsApp:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                        <span className="font-black text-slate-900 dark:text-white">1. Download File</span>
                        <p className="text-[11px]">Click Export above to save the <code>.wastickers</code> package on your device.</p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                        <span className="font-black text-slate-900 dark:text-white">2. Open in Sticker App</span>
                        <p className="text-[11px]">Open with &ldquo;Sticker Maker&rdquo;, &ldquo;WSTicK&rdquo;, or &ldquo;Personal Stickers for WhatsApp&rdquo;.</p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                        <span className="font-black text-slate-900 dark:text-white">3. Add to WhatsApp</span>
                        <p className="text-[11px]">Tap &ldquo;Add to WhatsApp&rdquo; inside the app. Enjoy your custom stickers in any chat!</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: CHAT PREVIEW SIMULATION */}
          {activeTab === "preview" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  WhatsApp Chat Bubble Simulation
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Wallpaper:</span>
                  <button
                    type="button"
                    onClick={() => setChatBgTheme("light")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chatBgTheme === "light"
                        ? "bg-slate-200 dark:bg-white/20 text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatBgTheme("dark")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chatBgTheme === "dark"
                        ? "bg-slate-200 dark:bg-white/20 text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Chat Bubble Canvas Simulation */}
              <div
                className={`relative min-h-[320px] rounded-3xl p-6 sm:p-8 flex flex-col justify-end gap-4 overflow-hidden border ${
                  chatBgTheme === "light"
                    ? "bg-[#EFEAE2] border-[#E0D8C8]"
                    : "bg-[#0B141A] border-white/10"
                }`}
                style={{
                  backgroundImage:
                    chatBgTheme === "light"
                      ? "radial-gradient(#0000000d 1px, transparent 1px)"
                      : "radial-gradient(#ffffff0a 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                {/* Incoming Message Bubble */}
                <div className="self-start max-w-[80%] rounded-2xl rounded-tl-none bg-white dark:bg-[#202C33] p-3 shadow-md border border-black/5 dark:border-white/5">
                  <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                    Hey! Check out the new sticker pack: <strong>{pack.title}</strong> 🔥
                  </p>
                  <span className="text-[9px] text-slate-400 block text-right mt-1">12:30 PM</span>
                </div>

                {/* Outgoing Sticker Message Bubble (No bubble border for stickers) */}
                <div className="self-end flex flex-col items-end gap-1">
                  <div className="relative h-44 w-44 sm:h-52 sm:w-52 transition-transform hover:scale-105">
                    {stickers[selectedStickerIndex]?.imageUrl ? (
                      <img
                        src={stickers[selectedStickerIndex].imageUrl}
                        alt="WhatsApp Sticker Preview"
                        className="h-full w-full object-contain filter drop-shadow-md"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handleStickerImageError(e, stickers[selectedStickerIndex]?.imageUrl)
                        }
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 text-slate-400 text-xs">
                        No sticker selected
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 pr-2">12:31 PM • Delivered</span>
                </div>
              </div>

              {/* Sticker Selector Carousel */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500">
                  Select sticker to test in chat bubble:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {stickers.map((s, idx) => (
                    <button
                      key={`preview-thumb-${idx}`}
                      type="button"
                      onClick={() => setSelectedStickerIndex(idx)}
                      className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border p-1 transition-all cursor-pointer ${
                        selectedStickerIndex === idx
                          ? "border-[#25D366] bg-[#25D366]/15 scale-105 shadow-md"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-400"
                      }`}
                    >
                      <img
                        src={s.imageUrl}
                        alt={`Slot ${idx + 1}`}
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleStickerImageError(e, s.imageUrl)}
                      />
                      <span className="absolute top-1 left-1 rounded-md bg-black/60 px-1 text-[8px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT SHARE & QR */}
          {activeTab === "direct-share" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single Sticker Share Tool */}
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-[#25D366]">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Direct Share Active Sticker
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Slot #{selectedStickerIndex + 1} • {pack.title}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex h-36 w-full items-center justify-center rounded-2xl bg-white dark:bg-black/20 p-2 border border-slate-200 dark:border-white/10">
                    {stickers[selectedStickerIndex]?.imageUrl ? (
                      <img
                        src={stickers[selectedStickerIndex].imageUrl}
                        alt="Selected Sticker"
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handleStickerImageError(e, stickers[selectedStickerIndex]?.imageUrl)
                        }
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Empty slot</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleShareCurrentSticker}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-xs font-black text-black shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>Share to Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySticker}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-3.5 py-2.5 text-xs font-black text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Image</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Transfer Panel */}
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5 text-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Scan with Mobile Camera
                  </span>

                  <div className="relative flex h-36 w-36 items-center justify-center rounded-2xl bg-white p-2 border border-slate-200 shadow-xs">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Pack Transfer QR"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <QrCode className="h-12 w-12 text-slate-300" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                    Scan on your phone to open this sticker pack directly and install into WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ZIP BUNDLE */}
          {activeTab === "zip" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500">
                    <FolderArchive className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Standard ZIP Archive
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Download raw high-resolution sticker assets for archiving, Photoshop editing, or Telegram import.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleExportZip("webp")}
                    disabled={isExporting || occupiedCount === 0}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 hover:border-emerald-500/50 transition-all cursor-pointer group text-left"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#25D366]">
                      Download WebP ZIP ({occupiedCount} Stickers)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ultra-light transparent WebP images formatted for messaging apps.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportZip("png")}
                    disabled={isExporting || occupiedCount === 0}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 hover:border-emerald-500/50 transition-all cursor-pointer group text-left"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#25D366]">
                      Download PNG ZIP ({occupiedCount} Stickers)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Lossless PNG cutouts with alpha transparency for graphic design software.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: JSON BACKUP */}
          {activeTab === "json" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
                    <FileCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      JSON Pack Manifest Backup
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Export a portable single JSON file containing all 30 slot configurations, reaction emoji associations, and image assets.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-3 text-xs font-black text-white dark:text-slate-900 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download .json Pack Backup</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-4">
          <span className="text-xs text-slate-500">
            {occupiedCount} of 30 slots filled • WhatsApp requires min. 3
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <WhatsAppHandoffModal
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        pack={pack}
      />
    </ResponsiveDialog>
  );
}
