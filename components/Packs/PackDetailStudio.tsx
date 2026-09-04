"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Settings,
  FolderArchive,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Zap,
  Package,
  Plus,
  Info,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord, StickerRecord } from "../../src/types/pack";
import { SlotCard } from "./SlotCard";
import { EditPackModal } from "./EditPackModal";
import { BatchValidationModal } from "./BatchValidationModal";
import { PackExportStudioModal } from "./PackExportStudioModal";
import { BatchSlotActions } from "./BatchSlotActions";
import { PublishPackModal } from "../Creator/PublishPackModal";
import { SharePackModal } from "../Creator/SharePackModal";
import { getCustomPublishedPacks } from "../../utils/exploreDb";
import {
  getPackById,
  updatePackMetadata,
  deletePack,
  saveStickerToSlot,
  deleteStickerFromSlot,
} from "../../utils/packApi";
import {
  getAllSlotDraftsForPack,
  saveSlotDraft,
  deleteSlotDraft,
  StickerDraft,
} from "../../utils/draftsDb";
import { createWaStickersArchive } from "../../utils/createWaStickers";

interface PackDetailStudioProps {
  initialPack: StickerPackRecord;
  onBack: () => void;
  onOpenEditorForSlot: (
    pack: StickerPackRecord,
    slotIndex: number,
    draftToResume?: StickerDraft | null,
    existingStickerUrl?: string | null
  ) => void;
  onPackUpdated?: (updatedPack: StickerPackRecord) => void;
  onPackDeleted?: () => void;
  onNavigateToExplore?: () => void;
}

export function PackDetailStudio({
  initialPack,
  onBack,
  onOpenEditorForSlot,
  onPackUpdated,
  onPackDeleted,
  onNavigateToExplore,
}: PackDetailStudioProps) {
  const [pack, setPack] = useState<StickerPackRecord>(initialPack);
  const [slotDrafts, setSlotDrafts] = useState<Record<number, StickerDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isExportStudioModalOpen, setIsExportStudioModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with initialPack prop if parent passes an updated reference
  useEffect(() => {
    setPack(initialPack);
  }, [initialPack]);

  // Check if pack has already been published to Community Explore
  useEffect(() => {
    let isMounted = true;
    getCustomPublishedPacks().then((customPacks) => {
      if (!isMounted) return;
      const found = customPacks.some(
        (p) => p.id === pack.id || p.id === `pack-${pack.id}`
      );
      setIsPublished(found);
    });
    return () => {
      isMounted = false;
    };
  }, [pack.id]);

  // Load slot drafts on mount or when pack ID changes
  useEffect(() => {
    let isMounted = true;
    getAllSlotDraftsForPack(initialPack.id)
      .then((drafts) => {
        if (isMounted) setSlotDrafts(drafts);
      })
      .catch((err) => {
        console.warn("Could not load local slot drafts:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [initialPack.id]);

  // Manual refresh helper for user-triggered refreshes
  const refreshPackData = useCallback(async () => {
    setIsLoading(true);
    try {
      const updated = await getPackById(pack.id);
      setPack(updated);
      const drafts = await getAllSlotDraftsForPack(pack.id);
      setSlotDrafts(drafts);
    } catch (err) {
      console.warn("Could not refresh pack state:", err);
    } finally {
      setIsLoading(false);
    }
  }, [pack.id]);

  // Index stickers by slotIndex (0..29)
  const stickersBySlot = useMemo(() => {
    const map: Record<number, StickerRecord> = {};
    if (pack.stickers) {
      pack.stickers.forEach((sticker) => {
        if (typeof sticker.slotIndex === "number") {
          map[sticker.slotIndex] = sticker;
        }
      });
    }
    return map;
  }, [pack.stickers]);

  const occupiedCount = Object.keys(stickersBySlot).length;
  const draftCount = Object.keys(slotDrafts).filter(
    (idx) => !stickersBySlot[parseInt(idx, 10)]
  ).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export full .wastickers archive for WhatsApp
  const handleExportWastickers = async () => {
    if (occupiedCount < 3) {
      showToast("WhatsApp requires at least 3 stickers in a pack to export.");
      return;
    }

    setIsExporting(true);
    showToast(`Packaging ${occupiedCount} stickers into .wastickers...`);

    try {
      const stickerUrls = pack.stickers.map((s) => s.imageUrl);
      const zipBlob = await createWaStickersArchive({
        packName: pack.title,
        authorName: pack.publisher || "Omoji Creator",
        stickers: stickerUrls,
        trayIcon: pack.trayIconUrl,
        animated: pack.stickers.some((s) => s.isAnimated),
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = (pack.title || "omoji_pack")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");
      a.download = `${safeName}.wastickers`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      showToast(`Exported "${pack.title}.wastickers" successfully!`);
    } catch (err: any) {
      console.error("Export pack error:", err);
      showToast(err.message || "Failed to generate .wastickers package.");
    } finally {
      setIsExporting(false);
    }
  };

  // Clear a committed sticker from a slot
  const handleClearSlot = async (slotIndex: number) => {
    try {
      const res = await deleteStickerFromSlot(pack.id, slotIndex);
      setPack(res.pack);
      if (onPackUpdated) onPackUpdated(res.pack);
      await deleteSlotDraft(pack.id, slotIndex);
      setSlotDrafts((prev) => {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      });
      showToast(`Cleared Slot #${slotIndex + 1}.`);
    } catch (err: any) {
      console.error("Failed to delete sticker:", err);
      showToast(err.message || "Failed to delete sticker.");
    }
  };

  // Discard a draft for a slot
  const handleDiscardDraft = async (slotIndex: number) => {
    try {
      await deleteSlotDraft(pack.id, slotIndex);
      setSlotDrafts((prev) => {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      });
      showToast(`Discarded draft for Slot #${slotIndex + 1}.`);
    } catch (err: any) {
      console.error("Failed to discard draft:", err);
      showToast(err.message || "Failed to discard draft.");
    }
  };

  // Quick upload file directly into slot
  const handleQuickUpload = async (slotIndex: number, file: File) => {
    try {
      showToast(`Uploading photo to Slot #${slotIndex + 1}...`);
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await saveStickerToSlot(pack.id, slotIndex, {
          imageUrl: dataUrl,
          emojis: ["✨"],
          isAnimated: file.type.includes("gif"),
        });
        setPack(res.pack);
        if (onPackUpdated) onPackUpdated(res.pack);
        await deleteSlotDraft(pack.id, slotIndex);
        setSlotDrafts((prev) => {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        });
        showToast(`✨ Added sticker to Slot #${slotIndex + 1}!`);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Quick upload failed:", err);
      showToast(err.message || "Failed to upload sticker.");
    }
  };

  // Metadata update handler
  const handleSaveMetadata = async (data: {
    title: string;
    publisher: string;
  }) => {
    const res = await updatePackMetadata(pack.id, data);
    setPack(res.pack);
    if (onPackUpdated) onPackUpdated(res.pack);
    showToast("Pack details updated.");
  };

  // Delete entire pack
  const handleDeletePack = async () => {
    await deletePack(pack.id);
    if (onPackDeleted) onPackDeleted();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 dark:bg-[#111b21]/95 px-4 py-3 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Breadcrumb & Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/15 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Back to Packs Hub"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Tray Icon & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 shadow-xs">
              {pack.trayIconUrl ? (
                <img
                  src={pack.trayIconUrl}
                  alt={pack.title}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Package className="h-6 w-6 text-emerald-600 dark:text-[#25D366]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk']">
                  {pack.title}
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-black text-[#25D366] border border-emerald-500/20">
                  {occupiedCount}/30
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created by <span className="font-bold text-slate-700 dark:text-zinc-300">{pack.publisher || "Omoji Creator"}</span>
                {draftCount > 0 && (
                  <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">
                    • {draftCount} draft{draftCount > 1 ? "s" : ""} in progress
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Studio Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Pack Details</span>
          </button>

          <button
            type="button"
            onClick={() => setIsValidationModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-[#25D366] hover:bg-emerald-500/20 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
            <span>Validate Spec</span>
          </button>

          {/* Publish to Community Explore */}
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            disabled={occupiedCount < 3}
            title={occupiedCount < 3 ? "Add at least 3 stickers to publish to the community" : "Publish to Explore Feed"}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isPublished
                ? "border-emerald-500/40 bg-emerald-500/15 text-[#25D366] hover:bg-emerald-500/25"
                : "border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <Globe className="h-4 w-4 text-[#25D366]" />
            <span>{isPublished ? "Published (Update)" : "Publish Pack"}</span>
          </button>

          {/* Share Pack Modal */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Share to WhatsApp & Socials"
          >
            <Share2 className="h-4 w-4 text-[#25D366]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportStudioModalOpen(true)}
            disabled={occupiedCount < 3}
            title={occupiedCount < 3 ? "Add at least 3 stickers to export to WhatsApp" : "Open Export Hub"}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#25D366] px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/25 hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FolderArchive className="h-4 w-4" />
            <span>Export Pack ({occupiedCount}/30)</span>
          </button>
        </div>
      </div>

      {/* Progress & WhatsApp Rule Alert Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-[#25D366]">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              WhatsApp 30-Slot Grid Structure
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Click any slot to open the cutout & effect studio. Finished stickers auto-save to cloud storage.
            </p>
          </div>
        </div>

        {/* Progress bar pill */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#25D366] to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${(occupiedCount / 30) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
            {occupiedCount} / 30
          </span>
        </div>
      </div>

      {/* Batch Operations Bar */}
      <BatchSlotActions
        pack={pack}
        slotDrafts={slotDrafts}
        onPackUpdated={(updated) => {
          setPack(updated);
          if (onPackUpdated) onPackUpdated(updated);
        }}
        onOpenValidationModal={() => setIsValidationModalOpen(true)}
        onOpenExportModal={() => setIsExportStudioModalOpen(true)}
        onShowToast={showToast}
      />

      {/* 30-Slot Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {Array.from({ length: 30 }).map((_, index) => {
          const sticker = stickersBySlot[index] || null;
          const draft = slotDrafts[index] || null;

          return (
            <SlotCard
              key={`slot-${index}`}
              slotIndex={index}
              sticker={sticker}
              draft={draft}
              onOpenEditor={(idx, draftToResume, existingStickerUrl) => {
                onOpenEditorForSlot(pack, idx, draftToResume, existingStickerUrl);
              }}
              onClearSlot={handleClearSlot}
              onDiscardDraft={handleDiscardDraft}
              onQuickUpload={handleQuickUpload}
            />
          );
        })}
      </div>

      {/* Batch Validation Diagnostics Modal */}
      <BatchValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        pack={pack}
        onPackUpdated={(updated) => {
          setPack(updated);
          if (onPackUpdated) onPackUpdated(updated);
        }}
        onProceedToExport={() => setIsExportStudioModalOpen(true)}
      />

      {/* Pack Export Studio Modal */}
      <PackExportStudioModal
        isOpen={isExportStudioModalOpen}
        onClose={() => setIsExportStudioModalOpen(false)}
        pack={pack}
      />

      {/* Edit Pack Metadata Modal */}
      <EditPackModal
        pack={pack}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveMetadata}
        onDeletePack={handleDeletePack}
      />

      {/* Self-Publishing Pipeline to Community Modal */}
      <PublishPackModal
        pack={pack}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublishedSuccess={(pubPack) => {
          setIsPublished(true);
          showToast(`🎉 Published "${pubPack.title}" to Explore!`);
        }}
        onNavigateToExplore={onNavigateToExplore}
        onShowNotice={showToast}
      />

      {/* Social Web Share Integration Modal */}
      <SharePackModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        type="pack"
        title={pack.title}
        creatorName={pack.publisher || "Omoji Creator"}
        shareUrl={`/?creator=${encodeURIComponent((pack.publisher || "me").toLowerCase())}`}
        imageUrl={pack.trayIconUrl || pack.stickers?.[0]?.imageUrl}
        stickersCount={occupiedCount}
        onShowNotice={showToast}
      />
    </div>
  );
}
