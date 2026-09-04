"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  Sparkles,
  Smile,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord, StickerRecord } from "../../src/types/pack";
import { saveStickerToSlot } from "../../utils/packApi";
import { deleteSlotDraft, StickerDraft } from "../../utils/draftsDb";

interface BatchSlotActionsProps {
  pack: StickerPackRecord;
  slotDrafts: Record<number, StickerDraft>;
  onPackUpdated: (updatedPack: StickerPackRecord) => void;
  onOpenValidationModal: () => void;
  onOpenExportModal: () => void;
  onShowToast: (message: string) => void;
}

const COMMON_EMOJIS_BANK = [
  "✨", "🔥", "😎", "😂", "🚀", "❤️", "👍", "🥳", "🎉", "👏",
  "🙌", "⭐", "😍", "🤩", "💯", "🤙", "✌️", "💪", "💡", "🎯",
  "🤤", "🤯", "🥳", "🥰", "😇", "🤫", "🫡", "🤝", "🎈", "💎"
];

export function BatchSlotActions({
  pack,
  slotDrafts,
  onPackUpdated,
  onOpenValidationModal,
  onOpenExportModal,
  onShowToast,
}: BatchSlotActionsProps) {
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  const occupiedSlots = new Set((pack.stickers || []).map((s) => s.slotIndex));
  const occupiedCount = occupiedSlots.size;

  // Find next consecutive empty slots
  const getNextEmptySlots = (neededCount: number): number[] => {
    const emptySlots: number[] = [];
    for (let i = 0; i < 30; i++) {
      if (!occupiedSlots.has(i)) {
        emptySlots.push(i);
        if (emptySlots.length >= neededCount) break;
      }
    }
    return emptySlots;
  };

  // Handle multi-image file batch upload
  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = getNextEmptySlots(files.length);
    if (availableSlots.length === 0) {
      onShowToast("All 30 slots are already filled in this pack.");
      return;
    }

    const uploadCount = Math.min(files.length, availableSlots.length);
    setIsBatchUploading(true);
    setUploadProgress({ current: 0, total: uploadCount });

    try {
      let currentPack = pack;
      for (let i = 0; i < uploadCount; i++) {
        const file = files[i];
        const targetSlot = availableSlots[i];
        setUploadProgress({ current: i + 1, total: uploadCount });

        const reader = new FileReader();
        const dataUrlPromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const dataUrl = await dataUrlPromise;

        const defaultEmoji = COMMON_EMOJIS_BANK[targetSlot % COMMON_EMOJIS_BANK.length];
        const res = await saveStickerToSlot(pack.id, targetSlot, {
          imageUrl: dataUrl,
          emojis: [defaultEmoji],
          isAnimated: file.type.includes("gif") || file.name.endsWith(".gif"),
        });

        currentPack = res.pack;
        await deleteSlotDraft(pack.id, targetSlot);
      }

      onPackUpdated(currentPack);
      onShowToast(`✨ Successfully imported ${uploadCount} stickers into consecutive slots!`);
    } catch (err: any) {
      console.error("Batch upload failed:", err);
      onShowToast(err.message || "Failed to batch upload photos.");
    } finally {
      setIsBatchUploading(false);
      if (multiFileInputRef.current) {
        multiFileInputRef.current.value = "";
      }
    }
  };

  // Smart Auto-Assign Reaction Emojis
  const handleSmartAssignEmojis = async () => {
    if (!pack.stickers || pack.stickers.length === 0) {
      onShowToast("No stickers to tag in this pack.");
      return;
    }

    try {
      let currentPack = pack;
      for (let i = 0; i < pack.stickers.length; i++) {
        const s = pack.stickers[i];
        const emojiIndex = (s.slotIndex ?? i) % COMMON_EMOJIS_BANK.length;
        const assignedEmoji = COMMON_EMOJIS_BANK[emojiIndex];

        const res = await saveStickerToSlot(pack.id, s.slotIndex ?? i, {
          imageUrl: s.imageUrl,
          emojis: [assignedEmoji],
          isAnimated: s.isAnimated,
        });
        currentPack = res.pack;
      }

      onPackUpdated(currentPack);
      onShowToast("✨ Smart reaction emojis assigned across all pack stickers!");
    } catch (err: any) {
      console.error("Smart emoji assignment failed:", err);
      onShowToast(err.message || "Failed to auto-assign emojis.");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3.5">
      {/* Hidden Multi File Input */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleBatchFileChange}
        className="hidden"
      />

      {/* Left Quick Batch Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isBatchUploading || occupiedCount >= 30}
          onClick={() => multiFileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/20 active:scale-95 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
        >
          {isBatchUploading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#25D366]" />
              <span>Importing ({uploadProgress.current}/{uploadProgress.total})...</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-3.5 w-3.5 text-[#25D366]" />
              <span>Batch Drop Photos ({30 - occupiedCount} slots free)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSmartAssignEmojis}
          disabled={occupiedCount === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/20 active:scale-95 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          title="Auto-assign unique WhatsApp reaction emojis across all slots"
        >
          <Smile className="h-3.5 w-3.5 text-amber-500" />
          <span>Auto-Tag Emojis</span>
        </button>
      </div>

      {/* Right Validation & Export Trigger Hub */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenValidationModal}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-[#25D366] hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>WhatsApp Inspector</span>
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          disabled={occupiedCount < 3}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#25D366] px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>Export Hub</span>
        </button>
      </div>
    </div>
  );
}
