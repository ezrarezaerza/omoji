"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord, StickerRecord } from "../../src/types/pack";
import { StickerDraft } from "../../utils/draftsDb";

interface SlotNavigatorProps {
  pack: StickerPackRecord;
  currentSlotIndex: number;
  slotDrafts?: Record<number, StickerDraft>;
  onSelectSlot: (slotIndex: number) => void;
  onSaveAndAdvance?: () => void;
  isSaving?: boolean;
}

export function SlotNavigator({
  pack,
  currentSlotIndex,
  slotDrafts = {},
  onSelectSlot,
  onSaveAndAdvance,
  isSaving = false,
}: SlotNavigatorProps) {
  const [isGridOpen, setIsGridOpen] = useState(false);

  // Build map of occupied stickers by slotIndex
  const stickersBySlot: Record<number, StickerRecord> = {};
  if (pack.stickers) {
    pack.stickers.forEach((s) => {
      if (typeof s.slotIndex === "number") {
        stickersBySlot[s.slotIndex] = s;
      }
    });
  }

  const occupiedCount = Object.keys(stickersBySlot).length;
  const canGoPrev = currentSlotIndex > 0;
  const canGoNext = currentSlotIndex < 29;

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 dark:bg-[#182229]/90 p-2.5 backdrop-blur-md">
      {/* Left: Current Slot Info & Popover Grid Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsGridOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-black text-slate-800 dark:text-white shadow-xs hover:border-[#25D366] hover:bg-emerald-50/50 dark:hover:bg-white/15 transition-all cursor-pointer"
          title="Open 30-slot navigator"
        >
          <Grid className="h-3.5 w-3.5 text-[#25D366]" />
          <span>Slot #{currentSlotIndex + 1} of 30</span>
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-[#25D366]">
          {occupiedCount}/30 filled
        </span>
      </div>

      {/* Center/Right: Prev, Next & Save-and-Advance CTA */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => canGoPrev && onSelectSlot(currentSlotIndex - 1)}
          className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Previous Slot"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline">Prev Slot</span>
        </button>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => canGoNext && onSelectSlot(currentSlotIndex + 1)}
          className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Next Slot"
        >
          <span className="hidden md:inline">Next Slot</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {onSaveAndAdvance && canGoNext && (
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveAndAdvance}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25D366] to-teal-500 px-3 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            title="Save current sticker and jump to next slot"
          >
            <span>Save & Next</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* 30-Slot Quick Jump Popover Dropdown */}
      <AnimatePresence>
        {isGridOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsGridOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111b21] p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Jump to Pack Slot
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    ({occupiedCount}/30)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGridOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* 30-Slot Grid Mini Map */}
              <div className="mt-3 grid grid-cols-6 gap-1.5 max-h-64 overflow-y-auto p-1">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const isCurrent = idx === currentSlotIndex;
                  const sticker = stickersBySlot[idx];
                  const hasDraft = !sticker && Boolean(slotDrafts[idx]);

                  return (
                    <button
                      key={`quick-slot-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectSlot(idx);
                        setIsGridOpen(false);
                      }}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "border-[#25D366] bg-[#25D366]/20 text-[#25D366] ring-2 ring-[#25D366]/40 scale-105"
                          : sticker
                          ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-800 dark:text-zinc-200 hover:border-[#25D366]"
                          : hasDraft
                          ? "border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:border-amber-500"
                          : "border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-400 hover:border-slate-400"
                      }`}
                      title={
                        sticker
                          ? `Slot #${idx + 1} (Committed)`
                          : hasDraft
                          ? `Slot #${idx + 1} (Draft)`
                          : `Slot #${idx + 1} (Empty)`
                      }
                    >
                      {sticker?.imageUrl || slotDrafts[idx]?.thumbnail || slotDrafts[idx]?.activeImageUrl ? (
                        <img
                          src={sticker?.imageUrl || slotDrafts[idx]?.thumbnail || slotDrafts[idx]?.activeImageUrl!}
                          alt={`Slot ${idx + 1}`}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span>{idx + 1}</span>
                      )}

                      {/* Status indicator dot */}
                      {sticker && (
                        <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                      )}
                      {hasDraft && (
                        <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
