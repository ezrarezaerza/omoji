"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchX, Sparkles, Layers } from "lucide-react";
import { ExplorePack, ExploreSticker } from "../../src/types/explore";
import { ExplorePackCard } from "./ExplorePackCard";

interface ExploreBentoGridProps {
  packs: ExplorePack[];
  isLoading: boolean;
  favoritedPackIds: string[];
  onToggleFavorite: (packId: string) => void;
  onExportPack: (pack: ExplorePack) => void;
  onCloneToStudio: (pack: ExplorePack) => void;
  onSelectStickerPreview?: (sticker: ExploreSticker, pack: ExplorePack) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onSharePack?: (pack: ExplorePack) => void;
  onClearFilters?: () => void;
}

export function ExploreBentoGrid({
  packs,
  isLoading,
  favoritedPackIds,
  onToggleFavorite,
  onExportPack,
  onCloneToStudio,
  onSelectStickerPreview,
  onOpenCreatorProfile,
  onSharePack,
  onClearFilters,
}: ExploreBentoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-[#111b21]/50 p-5 shadow-sm animate-pulse ${
              i === 0 ? "md:col-span-2" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-7 w-7 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-1/2 rounded-md bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
            <div className="h-28 rounded-2xl bg-slate-100 dark:bg-white/5 mb-4" />
            <div className="flex gap-2">
              <div className="h-9 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#111b21]/50 p-12 text-center my-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-4">
          <SearchX className="h-8 w-8 stroke-[1.8]" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
          No Sticker Packs Found
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          We couldn't find any sticker packs matching your filters or search terms. Try clearing your filters or searching for something else.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-black text-black shadow-md shadow-emerald-500/20 hover:bg-[#20bd5a] transition-transform active:scale-95 cursor-pointer font-['Space_Grotesk']"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Reset All Filters
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
      <AnimatePresence mode="popLayout">
        {packs.map((pack, index) => {
          // Grant featured 2-column span to the first featured pack in the list or every 5th pack
          const isFeaturedSpan = (pack.isFeatured && index === 0) || (pack.isTrending && index === 3);

          return (
            <ExplorePackCard
              key={pack.id}
              pack={pack}
              isFavorited={favoritedPackIds.includes(pack.id)}
              onToggleFavorite={onToggleFavorite}
              onExportPack={onExportPack}
              onCloneToStudio={onCloneToStudio}
              onSelectStickerPreview={onSelectStickerPreview}
              onOpenCreatorProfile={onOpenCreatorProfile}
              onSharePack={onSharePack}
              isFeaturedSpan={isFeaturedSpan}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
