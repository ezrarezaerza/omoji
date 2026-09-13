"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Heart,
  Package,
  Layers,
  Sparkles,
  Download,
  Trash2,
  CheckSquare,
  Square,
  ArrowRight,
  Plus,
  Loader2,
  Paintbrush,
  Eye,
  AlertCircle,
  FolderPlus,
  Compass,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FavoritedStickerRecord,
  getAllFavoriteStickerRecords,
  toggleFavoriteSticker,
  batchRemoveFavoriteStickers,
  getAllFavoritePackIds,
  toggleFavoritePack,
} from "../../utils/exploreDb";
import { getAllExplorePacks } from "../../utils/exploreEngine";
import { ExplorePack, ExploreSticker } from "../../src/types/explore";
import { StickerPackRecord } from "../../src/types/pack";
import { fetchPacks, saveStickerToSlot, createPack } from "../../utils/packApi";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import { ReactionBurst, useReactionBurst } from "./ReactionBurst";

interface SavedFavoritesViewProps {
  onInspectSticker: (sticker: ExploreSticker, pack: ExplorePack) => void;
  onRemixInStudio: (stickerUrl: string, stickerTitle?: string) => void;
  onClonePackToStudio: (studioPack: StickerPackRecord) => void;
  onExportPack: (pack: ExplorePack) => Promise<void>;
  onOpenStudioPack?: (studioPack: StickerPackRecord, slotIndex?: number) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onShowNotice?: (message: string) => void;
  onNavigateToFeed: () => void;
}

export function SavedFavoritesView({
  onInspectSticker,
  onRemixInStudio,
  onClonePackToStudio,
  onExportPack,
  onOpenStudioPack,
  onOpenCreatorProfile,
  onShowNotice,
  onNavigateToFeed,
}: SavedFavoritesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"stickers" | "packs">("stickers");
  const [favoriteStickers, setFavoriteStickers] = useState<FavoritedStickerRecord[]>([]);
  const [favoritePacks, setFavoritePacks] = useState<ExplorePack[]>([]);
  const [selectedStickerIds, setSelectedStickerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Batch import state
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [userPacks, setUserPacks] = useState<StickerPackRecord[]>([]);
  const [selectedTargetPackId, setSelectedTargetPackId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [newPackTitle, setNewPackTitle] = useState("");
  const [isCreatingNewPack, setIsCreatingNewPack] = useState(false);

  const { particles, triggerBurst, removeParticle } = useReactionBurst();

  // Load favorites
  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stickerRecords, favPackIds, allPacks] = await Promise.all([
        getAllFavoriteStickerRecords(),
        getAllFavoritePackIds(),
        getAllExplorePacks(),
      ]);

      // If sticker records don't have full sticker objects, attempt resolving from catalog
      const resolvedStickers = stickerRecords.map((rec) => {
        if (rec.sticker) return rec;
        // Lookup from catalog
        for (const p of allPacks) {
          const found = p.stickers.find((s) => s.id === rec.id);
          if (found) {
            return { ...rec, sticker: found, packTitle: p.title };
          }
        }
        return rec;
      });

      setFavoriteStickers(resolvedStickers);

      const resolvedPacks = allPacks.filter((p) => favPackIds.includes(p.id));
      setFavoritePacks(resolvedPacks);
    } catch (e) {
      console.warn("Failed to load favorites:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    const handleFavoritesChanged = () => {
      loadFavorites();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("omoji:favorites_changed", handleFavoritesChanged);
      return () => {
        window.removeEventListener("omoji:favorites_changed", handleFavoritesChanged);
      };
    }
  }, [loadFavorites]);

  // Load user packs for batch importing
  const handleOpenBatchImportModal = async () => {
    try {
      const packs = await fetchPacks();
      setUserPacks(packs);
      if (packs.length > 0) {
        setSelectedTargetPackId(packs[0].id);
      }
      setIsBatchImportModalOpen(true);
    } catch (e) {
      onShowNotice?.("Failed to fetch studio packs.");
    }
  };

  // Toggle selection of a single sticker
  const handleToggleSelectSticker = (id: string) => {
    setSelectedStickerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (selectedStickerIds.length === favoriteStickers.length) {
      setSelectedStickerIds([]);
    } else {
      setSelectedStickerIds(favoriteStickers.map((s) => s.id));
    }
  };

  // Batch delete from saved
  const handleBatchDelete = async () => {
    if (selectedStickerIds.length === 0) return;
    try {
      await batchRemoveFavoriteStickers(selectedStickerIds);
      setFavoriteStickers((prev) => prev.filter((s) => !selectedStickerIds.includes(s.id)));
      onShowNotice?.(`Removed ${selectedStickerIds.length} stickers from Saved.`);
      setSelectedStickerIds([]);
    } catch (e) {
      onShowNotice?.("Could not remove saved stickers.");
    }
  };

  // Remove single sticker from saved
  const handleRemoveSingle = async (stickerId: string) => {
    try {
      await toggleFavoriteSticker(stickerId);
      setFavoriteStickers((prev) => prev.filter((s) => s.id !== stickerId));
      setSelectedStickerIds((prev) => prev.filter((id) => id !== stickerId));
      onShowNotice?.("Sticker removed from Saved.");
    } catch {
      onShowNotice?.("Could not remove sticker.");
    }
  };

  // Remove pack from favorites
  const handleRemovePackFavorite = async (packId: string) => {
    try {
      await toggleFavoritePack(packId);
      setFavoritePacks((prev) => prev.filter((p) => p.id !== packId));
      onShowNotice?.("Pack removed from bookmarks.");
    } catch {
      onShowNotice?.("Could not remove bookmarked pack.");
    }
  };

  // Execute batch import into studio pack
  const handleExecuteBatchImport = async () => {
    if (selectedStickerIds.length === 0) return;

    let targetPack: StickerPackRecord | undefined;

    // Create new pack if chosen
    if (isCreatingNewPack) {
      const title = newPackTitle.trim() || "Imported Favorites";
      const firstSticker = favoriteStickers.find((s) => selectedStickerIds.includes(s.id));
      const tray = firstSticker?.sticker?.imageUrl;

      try {
        targetPack = await createPack({
          title,
          publisher: "Sticker Studio",
          trayIconUrl: tray,
        });
      } catch (err: any) {
        onShowNotice?.(err.message || "Failed to create new pack.");
        return;
      }
    } else {
      targetPack = userPacks.find((p) => p.id === selectedTargetPackId);
    }

    if (!targetPack) {
      onShowNotice?.("Please select or create a target pack.");
      return;
    }

    setIsImporting(true);
    const selectedRecords = favoriteStickers.filter((s) => selectedStickerIds.includes(s.id));
    setImportProgress({ current: 0, total: selectedRecords.length });

    // Calculate occupied slots
    const occupiedSlotSet = new Set((targetPack.stickers || []).map((s) => s.slotIndex));
    let nextAvailableSlot = 0;
    let importedCount = 0;

    for (let i = 0; i < selectedRecords.length; i++) {
      const rec = selectedRecords[i];
      const imageUrl = rec.sticker?.imageUrl;
      if (!imageUrl) continue;

      // Find next empty slot < 30
      while (occupiedSlotSet.has(nextAvailableSlot) && nextAvailableSlot < 30) {
        nextAvailableSlot++;
      }

      if (nextAvailableSlot >= 30) {
        onShowNotice?.("Pack reached maximum capacity of 30 slots.");
        break;
      }

      try {
        await saveStickerToSlot(targetPack.id, nextAvailableSlot, {
          imageUrl,
          emojis: rec.sticker?.emojis || ["✨"],
          isAnimated: Boolean(rec.sticker?.isAnimated),
        });
        occupiedSlotSet.add(nextAvailableSlot);
        importedCount++;
        setImportProgress({ current: i + 1, total: selectedRecords.length });
      } catch (err) {
        console.warn(`Failed to import sticker into slot ${nextAvailableSlot}:`, err);
      }
    }

    setIsImporting(false);
    setIsBatchImportModalOpen(false);
    triggerBurst("🎉", 10);
    onShowNotice?.(`Successfully imported ${importedCount} stickers into "${targetPack.title}"!`);
    setSelectedStickerIds([]);

    if (onOpenStudioPack) {
      onOpenStudioPack(targetPack);
    }
  };

  return (
    <div className="space-y-6">
      <ReactionBurst particles={particles} onComplete={removeParticle} />

      {/* Sub-navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111b21] p-4 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs">
            <Heart className="h-5 w-5 fill-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
              Saved & Favorites
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your bookmarked community stickers and packs offline
            </p>
          </div>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-[#182229] p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs font-bold font-['Space_Grotesk'] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("stickers")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
              activeSubTab === "stickers"
                ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Saved Stickers</span>
            <span className="rounded-full bg-slate-200 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
              {favoriteStickers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("packs")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
              activeSubTab === "packs"
                ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Package className="h-3.5 w-3.5 text-[#25D366]" />
            <span>Bookmarked Packs</span>
            <span className="rounded-full bg-slate-200 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">
              {favoritePacks.length}
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: SAVED STICKERS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "stickers" && (
        <div className="space-y-4">
          {/* Multi-selection Toolbar */}
          {favoriteStickers.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-100/80 dark:bg-[#182229] px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 hover:text-[#25D366] transition-colors cursor-pointer"
                >
                  {selectedStickerIds.length === favoriteStickers.length ? (
                    <CheckSquare className="h-4 w-4 text-[#25D366]" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                  <span>
                    {selectedStickerIds.length === favoriteStickers.length
                      ? "Deselect All"
                      : "Select All"}
                  </span>
                </button>

                {selectedStickerIds.length > 0 && (
                  <span className="rounded-full bg-[#25D366]/20 border border-[#25D366]/30 px-2 py-0.5 text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                    {selectedStickerIds.length} Selected
                  </span>
                )}
              </div>

              {/* Batch Actions */}
              {selectedStickerIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 font-bold text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove ({selectedStickerIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenBatchImportModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-1.5 font-black text-black shadow-sm hover:bg-[#20bd5a] transition-transform active:scale-95 cursor-pointer font-['Space_Grotesk']"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Batch Import into Pack</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#25D366] mb-2" />
              <p className="text-xs">Loading saved collection...</p>
            </div>
          ) : favoriteStickers.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 mb-3 border border-rose-500/20 shadow-xs">
                <Heart className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                No Saved Stickers Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                Click the heart icon on any sticker in the Explore feed or in the Sticker Inspector to bookmark it here. You can then batch-import them into any WhatsApp pack!
              </p>
              <button
                type="button"
                onClick={onNavigateToFeed}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-2.5 text-xs font-black text-black shadow-md shadow-emerald-500/20 hover:bg-[#20bd5a] transition-all cursor-pointer font-['Space_Grotesk']"
              >
                <Compass className="h-4 w-4" />
                <span>Browse Community Stickers</span>
              </button>
            </div>
          ) : (
            /* Saved Stickers Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {favoriteStickers.map((rec) => {
                const stk = rec.sticker;
                const isSelected = selectedStickerIds.includes(rec.id);
                if (!stk) return null;

                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 transition-all shadow-xs ${
                      isSelected
                        ? "border-[#25D366] bg-[#25D366]/10 ring-2 ring-[#25D366]/40"
                        : "border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] hover:border-slate-300 dark:hover:border-white/20"
                    }`}
                  >
                    {/* Select Checkbox (Top Left) */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectSticker(rec.id)}
                      className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-white/80 dark:bg-black/60 backdrop-blur-xs text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#25D366]" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                      )}
                    </button>

                    {/* Remove Bookmark Button (Top Right) */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSingle(rec.id)}
                      title="Remove from Saved"
                      className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 dark:bg-black/60 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Sticker Graphic Container (60fps Optimized) */}
                    <div
                      onClick={() => {
                        // Find matching pack or build fallback
                        const parentPack: ExplorePack = {
                          id: rec.packId || "saved_pack",
                          title: rec.packTitle || "Saved Sticker",
                          description: "Bookmarked community sticker",
                          category: "Trending",
                          tags: stk.tags || ["saved"],
                          trayIconUrl: stk.imageUrl,
                          creator: {
                            id: "community",
                            name: "Community Creator",
                            username: "community",
                            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                          },
                          stickers: [stk],
                          stickerCount: 1,
                          downloadCount: 120,
                          likesCount: 50,
                          isAnimated: Boolean(stk.isAnimated),
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        onInspectSticker(stk, parentPack);
                      }}
                      className="relative aspect-square w-full rounded-xl bg-slate-50 dark:bg-[#182229] p-2 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    >
                      <img
                        src={stk.imageUrl}
                        alt={stk.title || "Sticker"}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain pointer-events-none drop-shadow-sm"
                        style={{
                          contentVisibility: "auto",
                        }}
                      />

                      {/* Emoji Tag Badge */}
                      {stk.emojis && stk.emojis.length > 0 && (
                        <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-xs">
                          {stk.emojis[0]}
                        </span>
                      )}
                    </div>

                    {/* Info & Micro Action Bar */}
                    <div className="mt-2 pt-1 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate font-['Space_Grotesk']">
                          {stk.title || "Sticker"}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {rec.packTitle || "Community"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onRemixInStudio(stk.imageUrl, stk.title)}
                          title="Remix in Canvas Studio"
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-[#25D366] hover:text-black transition-colors cursor-pointer"
                        >
                          <Paintbrush className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: BOOKMARKED PACKS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "packs" && (
        <div>
          {favoritePacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#25D366]/10 text-[#25D366] mb-3 border border-[#25D366]/20 shadow-xs">
                <Package className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                No Bookmarked Packs Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                Whenever you find an entire sticker pack you like, click its heart icon in the Explore Community to bookmark the entire set here.
              </p>
              <button
                type="button"
                onClick={onNavigateToFeed}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-2.5 text-xs font-black text-black shadow-md shadow-emerald-500/20 hover:bg-[#20bd5a] transition-all cursor-pointer font-['Space_Grotesk']"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Trending Packs</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoritePacks.map((pack) => (
                <div
                  key={pack.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 shadow-xs hover:shadow-lg transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={pack.trayIconUrl}
                          alt={pack.title}
                          className="h-12 w-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#182229] object-contain p-1 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 dark:text-white font-['Space_Grotesk'] truncate">
                            {pack.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            by{" "}
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCreatorProfile && pack.creator.username) {
                                  onOpenCreatorProfile(pack.creator.username);
                                }
                              }}
                              className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#25D366] transition-colors cursor-pointer inline underline-offset-2 hover:underline"
                            >
                              {pack.creator.name}
                            </button>{" "}
                            • {pack.stickerCount} stickers
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePackFavorite(pack.id)}
                        title="Remove Bookmark"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Reel Preview */}
                    <div className="grid grid-cols-4 gap-2 mb-4 p-2 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-100 dark:border-white/5">
                      {pack.stickers.slice(0, 4).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onInspectSticker(s, pack)}
                          className="aspect-square rounded-xl bg-white dark:bg-[#111b21] p-1 border border-slate-200/60 dark:border-white/10 hover:scale-105 transition-transform cursor-pointer"
                        >
                          <img
                            src={s.imageUrl}
                            alt="Sticker"
                            className="h-full w-full object-contain pointer-events-none"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => onExportPack(pack)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-xs font-black text-black shadow-xs hover:bg-[#20bd5a] transition-all cursor-pointer font-['Space_Grotesk']"
                    >
                      <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Download WhatsApp Pack</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        import("../../utils/exploreEngine").then(({ convertExplorePackToStudioPack }) => {
                          const studioPack = convertExplorePackToStudioPack(pack);
                          onClonePackToStudio(studioPack);
                        });
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-[#202c33] transition-all cursor-pointer font-['Space_Grotesk']"
                    >
                      <Layers className="h-3.5 w-3.5 text-[#25D366]" />
                      <span>Open in Studio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BATCH IMPORT TO PACK DIALOG */}
      {/* ------------------------------------------------------------- */}
      <ResponsiveDialog
        isOpen={isBatchImportModalOpen}
        onClose={() => {
          if (!isImporting) setIsBatchImportModalOpen(false);
        }}
        title={`Batch Import (${selectedStickerIds.length} Stickers)`}
        description="Choose a studio pack to automatically fill with your saved stickers"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          {/* Target pack choice toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-[#182229] p-1 rounded-2xl text-xs font-bold font-['Space_Grotesk']">
            <button
              type="button"
              onClick={() => setIsCreatingNewPack(false)}
              className={`rounded-xl py-2 transition-all cursor-pointer ${
                !isCreatingNewPack
                  ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Existing Studio Pack
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNewPack(true)}
              className={`rounded-xl py-2 transition-all cursor-pointer ${
                isCreatingNewPack
                  ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              + Create New Pack
            </button>
          </div>

          {!isCreatingNewPack ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Destination Pack:
              </label>
              {userPacks.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-100 dark:bg-[#182229]">
                  No existing packs found. Please choose "Create New Pack".
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {userPacks.map((p) => {
                    const occupied = p.stickers?.length || 0;
                    const available = 30 - occupied;
                    const isSelected = selectedTargetPackId === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedTargetPackId(p.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#25D366] bg-[#25D366]/10 ring-2 ring-[#25D366]/30"
                            : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {p.trayIconUrl ? (
                            <img
                              src={p.trayIconUrl}
                              alt=""
                              className="h-8 w-8 rounded-xl object-contain bg-slate-100 dark:bg-white/10 p-0.5"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 dark:bg-white/10 text-xs font-bold">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-black text-xs text-slate-900 dark:text-white truncate font-['Space_Grotesk']">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {occupied}/30 slots filled • {available} empty
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check className="h-4 w-4 text-[#25D366] stroke-[3]" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                New Pack Title:
              </label>
              <input
                type="text"
                value={newPackTitle}
                onChange={(e) => setNewPackTitle(e.target.value)}
                placeholder="e.g. My Favorite Memes"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#25D366] font-['Space_Grotesk']"
              />
            </div>
          )}

          {/* Import Progress Bar */}
          {isImporting && importProgress && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20">
              <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span>Transferring stickers...</span>
                <span>
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#25D366] transition-all duration-200"
                  style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              disabled={isImporting}
              onClick={() => setIsBatchImportModalOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isImporting || (!isCreatingNewPack && !selectedTargetPackId)}
              onClick={handleExecuteBatchImport}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-black text-black shadow-md hover:bg-[#20bd5a] transition-all cursor-pointer font-['Space_Grotesk'] disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
              <span>{isImporting ? "Importing..." : "Confirm & Import"}</span>
            </button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
