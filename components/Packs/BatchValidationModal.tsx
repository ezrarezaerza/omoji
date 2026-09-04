"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  FileCheck,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord, StickerRecord } from "../../src/types/pack";
import {
  validateWhatsAppPack,
  WhatsAppPackDiagnostics,
  formatBytes,
} from "../../utils/whatsappValidator";
import { sanitizeAndTranscodeToWhatsAppWebP } from "../../utils/webpTranscoder";
import { saveStickerToSlot } from "../../utils/packApi";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";

interface BatchValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: StickerPackRecord;
  onPackUpdated?: (pack: StickerPackRecord) => void;
  onProceedToExport?: () => void;
}

export function BatchValidationModal({
  isOpen,
  onClose,
  pack,
  onPackUpdated,
  onProceedToExport,
}: BatchValidationModalProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [diagnostics, setDiagnostics] = useState<WhatsAppPackDiagnostics | null>(null);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState<{ current: number; total: number; step: string }>({
    current: 0,
    total: 0,
    step: "",
  });
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const stickerUrls = (pack.stickers || []).map((s) => s.imageUrl);
      const isAnimated = pack.stickers?.some((s) => s.isAnimated) || false;

      const report = await validateWhatsAppPack(
        stickerUrls,
        pack.title,
        pack.publisher || "Omoji Creator",
        isAnimated
      );

      setDiagnostics(report);
    } catch (err) {
      console.error("Batch validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runValidation();
    }
  }, [isOpen, pack.id, pack.stickers?.length]);

  // One-Click Batch Optimize & Transcode all stickers to strict WhatsApp 512x512 with safe margin
  const handleAutoFixAll = async () => {
    if (!pack.stickers || pack.stickers.length === 0) return;

    setIsAutoFixing(true);
    const total = pack.stickers.length;
    let updatedPack = pack;

    try {
      for (let i = 0; i < total; i++) {
        const sticker = pack.stickers[i];
        setFixProgress({
          current: i + 1,
          total,
          step: `Optimizing Slot #${(sticker.slotIndex ?? i) + 1} to WhatsApp 512x512 WebP with 16px gutter...`,
        });

        const transcodeResult = await sanitizeAndTranscodeToWhatsAppWebP(sticker.imageUrl, {
          targetWidth: 512,
          targetHeight: 512,
          enforceSafetyMargin: true,
          marginPixels: 16,
          maxFileSizeKB: sticker.isAnimated ? 490 : 98,
          format: "image/webp",
        });

        // Convert blob to DataURL
        const reader = new FileReader();
        const dataUrlPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(transcodeResult.blob);
        });
        const optimizedDataUrl = await dataUrlPromise;

        const res = await saveStickerToSlot(pack.id, sticker.slotIndex ?? i, {
          imageUrl: optimizedDataUrl,
          emojis: sticker.emojis || ["✨"],
          isAnimated: sticker.isAnimated,
        });
        updatedPack = res.pack;
      }

      if (onPackUpdated) {
        onPackUpdated(updatedPack);
      }

      setSuccessToast("All stickers successfully optimized & compliant with WhatsApp!");
      await runValidation();
    } catch (err: any) {
      console.error("Auto-fix batch failed:", err);
      setSuccessToast(`Auto-fix error: ${err.message}`);
    } finally {
      setIsAutoFixing(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Batch Validation"
      description={`Auditing ${pack.title} against official WhatsApp specifications`}
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
          <ShieldCheck className="h-5 w-5" />
        </div>
      }
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6 font-sans">
        {/* Toast Notification */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
                <span>{successToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessToast(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Status Cards Bento */}
        {isValidating ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw className="h-8 w-8 text-[#25D366] animate-spin" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Inspecting sticker dimensions, transparency, margins & file sizes...
            </span>
          </div>
        ) : diagnostics ? (
          <>
            {/* Overall Health Score Card */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border p-5 ${
                diagnostics.allValid
                  ? "border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20"
                  : "border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    diagnostics.allValid
                      ? "bg-[#25D366] text-black"
                      : "bg-amber-500 text-black"
                  }`}
                >
                  {diagnostics.allValid ? (
                    <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
                  ) : (
                    <AlertTriangle className="h-7 w-7 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {diagnostics.allValid
                      ? "100% WhatsApp Ready!"
                      : "WhatsApp Specification Warning"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {diagnostics.summaryMessage}
                  </p>
                </div>
              </div>

              {/* Auto-Fix CTA */}
              {!diagnostics.allValid && (
                <button
                  type="button"
                  disabled={isAutoFixing}
                  onClick={handleAutoFixAll}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#25D366] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAutoFixing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Optimizing ({fixProgress.current}/{fixProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Auto-Fix & Optimize All</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Spec Check Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* 1. Pack Count */}
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Sticker Count
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {diagnostics.stickerCount} / 30
                  </span>
                  {diagnostics.isCountValid ? (
                    <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {diagnostics.isCountValid
                    ? "Min 3, Max 30 valid"
                    : `Needs at least ${3 - diagnostics.stickerCount} more`}
                </span>
              </div>

              {/* 2. Total Size */}
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Total Payload
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {diagnostics.totalSizeFormatted}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                </div>
                <span className="text-[10px] text-slate-500">
                  {pack.stickers?.some((s) => s.isAnimated) ? "Max 50MB animated" : "Optimized WebP"}
                </span>
              </div>

              {/* 3. Margin Compliance */}
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  16px Safe Gutter
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {diagnostics.stickers.filter((s) => s.hasMarginPadding).length} / {diagnostics.stickerCount}
                  </span>
                  {diagnostics.stickers.every((s) => s.hasMarginPadding) ? (
                    <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">Prevents clipping</span>
              </div>

              {/* 4. Format & Alpha */}
              <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  512×512 WebP
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {diagnostics.stickers.filter((s) => s.isDimensionValid).length} / {diagnostics.stickerCount}
                  </span>
                  {diagnostics.stickers.every((s) => s.isDimensionValid) ? (
                    <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">Exact pixel spec</span>
              </div>
            </div>

            {/* Per-Sticker Diagnostics List */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Individual Sticker Diagnostics ({diagnostics.stickerCount})
              </h4>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {diagnostics.stickers.map((diag, index) => {
                  const sticker = pack.stickers?.[index];
                  const slotNum = (sticker?.slotIndex ?? index) + 1;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 flex items-center justify-center">
                          {sticker?.imageUrl ? (
                            <img
                              src={sticker.imageUrl}
                              alt={`Slot #${slotNum}`}
                              className="h-full w-full object-contain p-0.5"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Slot #{slotNum}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {diag.width}×{diag.height} • {diag.sizeFormatted}
                            </span>
                          </div>

                          {diag.errors.length > 0 && (
                            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                              {diag.errors[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span>Score {diag.qualityScore}%</span>
                        </div>
                        {diag.status === "valid" ? (
                          <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                        ) : diag.status === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {/* Action Buttons in Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runValidation}
              disabled={isValidating}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
              <span>Re-check</span>
            </button>

            {onProceedToExport && (
              <button
                type="button"
                disabled={diagnostics ? !diagnostics.isCountValid : false}
                onClick={() => {
                  onClose();
                  onProceedToExport();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#25D366] px-5 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>Proceed to Pack Exporter</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
