"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Check,
  Sparkles,
  ArrowRight,
  FolderPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExploreSticker, ExplorePack } from "../../src/types/explore";
import { StickerPackRecord } from "../../src/types/pack";
import { fetchPacks, saveStickerToSlot, createPack } from "../../utils/packApi";

interface AddToSlotDrawerProps {
  sticker: ExploreSticker;
  pack: ExplorePack;
  onSuccess: (pack: StickerPackRecord, slotIndex: number) => void;
  onOpenStudioPack: (pack: StickerPackRecord, slotIndex?: number) => void;
  onClose: () => void;
}

export function AddToSlotDrawer({
  sticker,
  pack,
  onSuccess,
  onOpenStudioPack,
  onClose,
}: AddToSlotDrawerProps) {
  const [userPacks, setUserPacks] = useState<StickerPackRecord[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isSavingSlot, setIsSavingSlot] = useState<number | null>(null);
  const [justSavedSlot, setJustSavedSlot] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load user packs
  useEffect(() => {
    async function load() {
      setIsLoadingPacks(true);
      try {
        const packs = await fetchPacks();
        setUserPacks(packs);
        if (packs.length > 0) {
          setSelectedPackId(packs[0].id);
        }
      } catch (e: any) {
        console.warn("Could not fetch user packs:", e);
      } finally {
        setIsLoadingPacks(false);
      }
    }
    load();
  }, []);

  const currentPack = userPacks.find((p) => p.id === selectedPackId);

  // Quick Starter Pack Creator if user has no packs
  const handleCreateQuickPack = async () => {
    setIsLoadingPacks(true);
    try {
      const newPack = await createPack({
        title: "My Custom Pack",
        publisher: "Sticker Studio",
        trayIconUrl: sticker.imageUrl,
      });
      setUserPacks((prev) => [newPack, ...prev]);
      setSelectedPackId(newPack.id);
    } catch (e: any) {
      setErrorMessage(e.message || "Could not create starter pack.");
    } finally {
      setIsLoadingPacks(false);
    }
  };

  // 1-Tap commit to slot
  const handleAssignSlot = async (slotIndex: number) => {
    if (!currentPack) return;
    setIsSavingSlot(slotIndex);
    setErrorMessage(null);

    try {
      const result = await saveStickerToSlot(currentPack.id, slotIndex, {
        imageUrl: sticker.imageUrl,
        emojis: sticker.emojis || ["✨"],
        isAnimated: Boolean(sticker.isAnimated),
      });

      // Update local pack state
      const updatedStickers = [...(currentPack.stickers || [])];
      const existingIdx = updatedStickers.findIndex((s) => s.slotIndex === slotIndex);
      if (existingIdx >= 0) {
        updatedStickers[existingIdx] = result.sticker;
      } else {
        updatedStickers.push(result.sticker);
      }
      const updatedPack = { ...currentPack, stickers: updatedStickers };

      setUserPacks((prev) =>
        prev.map((p) => (p.id === updatedPack.id ? updatedPack : p))
      );

      setJustSavedSlot(slotIndex);
      onSuccess(updatedPack, slotIndex);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add sticker to slot.");
    } finally {
      setIsSavingSlot(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pack Selection Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 dark:bg-[#111b21] p-3 rounded-2xl border border-slate-200/90 dark:border-white/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Layers className="h-4 w-4 text-[#25D366] shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            Target Pack:
          </span>

          {userPacks.length > 0 ? (
            <select
              value={selectedPackId}
              onChange={(e) => {
                setSelectedPackId(e.target.value);
                setJustSavedSlot(null);
              }}
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#25D366] truncate cursor-pointer font-['Space_Grotesk']"
            >
              {userPacks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.stickers?.length || 0}/30 slots)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 italic">No studio packs found yet</span>
          )}
        </div>

        {/* Quick new pack action */}
        <button
          type="button"
          onClick={handleCreateQuickPack}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-white dark:bg-[#182229] border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:border-[#25D366] hover:bg-slate-50 dark:hover:bg-[#202c33] transition-all cursor-pointer shrink-0 font-['Space_Grotesk']"
        >
          <FolderPlus className="h-3.5 w-3.5 text-[#25D366]" />
          <span>New Pack</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Banner */}
      <AnimatePresence>
        {justSavedSlot !== null && currentPack && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-2xl bg-[#25D366]/15 border border-[#25D366]/40 p-3 text-xs"
          >
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <Sparkles className="h-4 w-4 text-[#25D366] shrink-0" />
              <span>
                Placed into <strong>Slot #{justSavedSlot + 1}</strong> of "{currentPack.title}"!
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenStudioPack(currentPack, justSavedSlot)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#25D366] px-3 py-1.5 text-[11px] font-black text-black shadow-xs hover:bg-[#20bd5a] transition-all cursor-pointer font-['Space_Grotesk']"
            >
              <span>View in Studio</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 30-Slot Visual Grid */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#0b141a] p-3">
        <div className="flex items-center justify-between mb-2.5 px-1 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Pick a Slot (1–30) to Transfer:
          </span>
          {currentPack && (
            <span className="font-semibold text-slate-400">
              {currentPack.stickers?.length || 0} / 30 Occupied
            </span>
          )}
        </div>

        {isLoadingPacks ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#25D366] mb-2" />
            <span className="text-xs">Loading studio slots...</span>
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {Array.from({ length: 30 }).map((_, slotIndex) => {
              const existing = currentPack?.stickers?.find((s) => s.slotIndex === slotIndex);
              const isOccupied = Boolean(existing);
              const isSaving = isSavingSlot === slotIndex;
              const isJustSaved = justSavedSlot === slotIndex;

              return (
                <button
                  key={slotIndex}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleAssignSlot(slotIndex)}
                  title={
                    isOccupied
                      ? `Slot #${slotIndex + 1} (Occupied - click to replace)`
                      : `Slot #${slotIndex + 1} (Empty - click to add)`
                  }
                  className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                    isJustSaved
                      ? "border-[#25D366] bg-[#25D366]/20 ring-2 ring-[#25D366]/40 scale-105"
                      : isOccupied
                      ? "border-slate-300 dark:border-white/15 bg-white dark:bg-[#182229] hover:border-amber-500/60"
                      : "border-dashed border-slate-300 dark:border-white/20 bg-white/60 dark:bg-white/5 hover:border-[#25D366] hover:bg-[#25D366]/10"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#25D366]" />
                  ) : isJustSaved ? (
                    <Check className="h-5 w-5 text-[#25D366] stroke-[3]" />
                  ) : isOccupied ? (
                    <div className="relative h-full w-full">
                      <img
                        src={existing?.imageUrl}
                        alt={`Slot ${slotIndex + 1}`}
                        className="h-full w-full object-contain pointer-events-none"
                      />
                      <span className="absolute -top-1 -right-1 rounded-full bg-slate-800 dark:bg-slate-700 px-1 text-[8px] text-white">
                        {slotIndex + 1}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#25D366]">
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span className="text-[9px] font-bold mt-0.5">#{slotIndex + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
