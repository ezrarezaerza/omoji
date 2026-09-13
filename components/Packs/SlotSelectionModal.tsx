"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Check,
  FolderPlus,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import { StickerPackRecord } from "../../src/types/pack";
import { fetchPacks, createPack } from "../../utils/packApi";

interface SlotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  file?: File | null;
  title?: string;
  onSelectSlot: (pack: StickerPackRecord, slotIndex: number, imageUrl?: string | null, file?: File | null) => void;
  defaultCreatorName?: string;
}

export function SlotSelectionModal({
  isOpen,
  onClose,
  imageUrl,
  file,
  title = "Select Sticker Pack & Slot",
  onSelectSlot,
  defaultCreatorName = "Sticker Creator",
}: SlotSelectionModalProps) {
  const [packs, setPacks] = useState<StickerPackRecord[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    fetchPacks()
      .then((data) => {
        if (!isMounted) return;
        setPacks(data);
        if (data.length > 0) {
          setSelectedPackId(data[0].id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Could not load packs:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const currentPack = packs.find((p) => p.id === selectedPackId);

  const handleCreateQuickPack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newPackTitle.trim();
    if (!cleanTitle) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const created = await createPack({
        title: cleanTitle,
        publisher: defaultCreatorName,
        trayIconUrl: imageUrl || undefined,
      });
      setPacks((prev) => [created, ...prev]);
      setSelectedPackId(created.id);
      setIsCreatingPack(false);
      setNewPackTitle("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create sticker pack.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseSlot = (slotIndex: number) => {
    if (!currentPack) return;
    onSelectSlot(currentPack, slotIndex, imageUrl, file);
    onClose();
  };

  return (
    <ResponsiveDialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 pt-1">
        {/* Pack-First Explanatory Pill */}
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          <Sparkles className="h-4 w-4 text-[#25D366] shrink-0" />
          <span>
            WhatsApp requires all stickers to belong to a pack. Choose which pack and slot to open this sticker into:
          </span>
        </div>

        {/* Thumbnail Preview if provided */}
        {imageUrl && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-black/40 p-1 flex items-center justify-center shrink-0 overflow-hidden border border-black/10 dark:border-white/10">
              <img
                src={imageUrl}
                alt="Selected asset"
                className="h-full w-full object-contain pointer-events-none"
              />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                Asset ready for Studio
              </div>
              <div className="text-slate-400 text-[11px] truncate">
                Will open with 512×512 canvas and auto-cutout tools
              </div>
            </div>
          </div>
        )}

        {/* Pack Selector Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-100 dark:bg-[#111b21] p-3 rounded-2xl border border-slate-200/90 dark:border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Layers className="h-4 w-4 text-[#25D366] shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              Pack:
            </span>

            {packs.length > 0 ? (
              <select
                value={selectedPackId}
                onChange={(e) => setSelectedPackId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#25D366] truncate cursor-pointer font-['Space_Grotesk']"
              >
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.stickers?.length || 0}/30 slots)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400 italic">No sticker packs created yet</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingPack((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-white dark:bg-[#182229] border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:border-[#25D366] hover:bg-slate-50 dark:hover:bg-[#202c33] transition-all cursor-pointer shrink-0 font-['Space_Grotesk']"
          >
            <FolderPlus className="h-3.5 w-3.5 text-[#25D366]" />
            <span>New Pack</span>
          </button>
        </div>

        {/* Inline Create Pack Form */}
        <AnimatePresence>
          {isCreatingPack && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateQuickPack}
              className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
            >
              <input
                type="text"
                placeholder="New Pack Name..."
                value={newPackTitle}
                onChange={(e) => setNewPackTitle(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#25D366]"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !newPackTitle.trim()}
                className="rounded-lg bg-[#25D366] text-black px-3 py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-[#20bd5a] transition-all cursor-pointer shrink-0"
              >
                Create
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 30-Slot Visual Grid */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#0b141a] p-3">
          <div className="flex items-center justify-between mb-2.5 px-1 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Select an Open Slot (1–30):
            </span>
            {currentPack && (
              <span className="font-semibold text-slate-400">
                {currentPack.stickers?.length || 0} / 30 Filled
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#25D366] mb-2" />
              <span className="text-xs">Loading studio packs...</span>
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <p>Please create a sticker pack first using the "New Pack" button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {Array.from({ length: 30 }).map((_, slotIndex) => {
                const existing = currentPack?.stickers?.find((s) => s.slotIndex === slotIndex);
                const isOccupied = Boolean(existing);

                return (
                  <button
                    key={slotIndex}
                    type="button"
                    onClick={() => handleChooseSlot(slotIndex)}
                    title={
                      isOccupied
                        ? `Slot #${slotIndex + 1} (Occupied - click to replace/edit)`
                        : `Slot #${slotIndex + 1} (Empty - click to use)`
                    }
                    className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                      isOccupied
                        ? "border-slate-300 dark:border-white/15 bg-white dark:bg-[#182229] hover:border-amber-500/60"
                        : "border-dashed border-slate-300 dark:border-white/20 bg-white/60 dark:bg-white/5 hover:border-[#25D366] hover:bg-[#25D366]/10"
                    }`}
                  >
                    {isOccupied ? (
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
    </ResponsiveDialog>
  );
}
