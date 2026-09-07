"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Download,
  ExternalLink,
  Sparkles,
  Check,
  Flame,
  BadgeCheck,
  Layers,
  Smile,
  Share2,
  Smartphone,
} from "lucide-react";
import { ExplorePack, ExploreSticker } from "../../src/types/explore";
import { ReactionBurst, useReactionBurst } from "./ReactionBurst";
import { handleStickerImageError } from "../../utils/imageHelper";

interface ExplorePackCardProps {
  pack: ExplorePack;
  isFavorited: boolean;
  onToggleFavorite: (packId: string) => void;
  onExportPack: (pack: ExplorePack) => void;
  onCloneToStudio: (pack: ExplorePack) => void;
  onSelectStickerPreview?: (sticker: ExploreSticker, pack: ExplorePack) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onSharePack?: (pack: ExplorePack) => void;
  isFeaturedSpan?: boolean;
}

export function ExplorePackCard({
  pack,
  isFavorited,
  onToggleFavorite,
  onExportPack,
  onCloneToStudio,
  onSelectStickerPreview,
  onOpenCreatorProfile,
  onSharePack,
  isFeaturedSpan = false,
}: ExplorePackCardProps) {
  const { particles, triggerBurst, removeParticle } = useReactionBurst();
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerBurst("❤️", 8);
    onToggleFavorite(pack.id);
  };

  const handleQuickReaction = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    setActiveReaction(emoji);
    triggerBurst(emoji, 7);
    setTimeout(() => setActiveReaction(null), 1200);
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      await onExportPack(pack);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClone = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerBurst("✨", 6);
    onCloneToStudio(pack);
  };

  // Preview slice: 5 for featured cards, 4 for standard cards
  const previewStickers = pack.stickers.slice(0, isFeaturedSpan ? 6 : 4);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20 transition-all ${
        isFeaturedSpan ? "md:col-span-2 bg-gradient-to-br from-white via-white to-slate-50 dark:from-[#111b21] dark:via-[#111b21] dark:to-[#182229]" : ""
      }`}
    >
      {/* Floating Reaction Burst Canvas */}
      <ReactionBurst particles={particles} onComplete={removeParticle} />

      <div>
        {/* Top Meta Bar: Category, Badges & Favorite Action */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {pack.category}
            </span>
            {pack.isTrending && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                <span>Trending</span>
              </span>
            )}
            {pack.isFeatured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>Featured</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Micro-Reaction Buttons on Hover */}
            <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => handleQuickReaction(e, "🔥")}
                title="React Fire"
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs transition-transform active:scale-125 cursor-pointer"
              >
                🔥
              </button>
              <button
                type="button"
                onClick={(e) => handleQuickReaction(e, "😂")}
                title="React Laugh"
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs transition-transform active:scale-125 cursor-pointer"
              >
                😂
              </button>
            </div>

            {/* Favorite / Bookmark Button */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-90 cursor-pointer ${
                isFavorited
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                  : "border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              }`}
            >
              <Heart
                className={`h-4 w-4 stroke-[2.2] transition-transform ${
                  isFavorited ? "fill-rose-500 scale-110" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Header Content: Tray Icon & Pack Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <img
            src={pack.trayIconUrl}
            alt={pack.title}
            className="h-14 w-14 rounded-2xl border-2 border-slate-100 dark:border-white/15 bg-slate-100 dark:bg-[#1a232a] object-contain p-1 shadow-md shrink-0"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={(e) => handleStickerImageError(e, pack.trayIconUrl)}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk'] truncate">
              {pack.title}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenCreatorProfile && pack.creator.username) {
                  onOpenCreatorProfile(pack.creator.username);
                }
              }}
              title={`View ${pack.creator.name}'s profile`}
              className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left group/creator"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover/creator:text-[#25D366] transition-colors truncate">
                by {pack.creator.name}
              </span>
              {pack.creator.verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/20 shrink-0" />
              )}
            </button>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {pack.description}
            </p>
          </div>
        </div>

        {/* Sticker Bento Reel Showcase */}
        <div className="relative mb-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-black/20 p-2.5">
          <div className={`grid gap-2 ${isFeaturedSpan ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-4"}`}>
            {previewStickers.map((sticker, idx) => (
              <div
                key={sticker.id}
                onClick={() => onSelectStickerPreview?.(sticker, pack)}
                className="group/item relative aspect-square rounded-xl bg-white dark:bg-[#182229] border border-slate-200/70 dark:border-white/10 p-1 shadow-xs hover:shadow-md hover:scale-105 transition-all cursor-pointer overflow-hidden"
              >
                <img
                  src={sticker.imageUrl}
                  alt={sticker.title || `Sticker ${idx + 1}`}
                  className="h-full w-full object-contain pointer-events-none"
                  loading="lazy"
                  decoding="async"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleStickerImageError(e, sticker.imageUrl)}
                  style={{ contentVisibility: "auto" }}
                />
                {/* Emoji badge */}
                {sticker.emojis && sticker.emojis.length > 0 && (
                  <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1 py-0.2 text-[10px] text-white backdrop-blur-xs">
                    {sticker.emojis[0]}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{pack.stickerCount} stickers total</span>
            </span>
            <span>{(pack.downloadCount || 0).toLocaleString()} downloads</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
        {/* Export .wastickers for WhatsApp */}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-xs font-black text-black shadow-md shadow-emerald-500/20 hover:bg-[#20bd5a] active:scale-95 transition-all cursor-pointer font-['Space_Grotesk']"
        >
          {isExporting ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <Smartphone className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
          <span>Add to WhatsApp</span>
        </button>

        {/* Clone / Open in 30-slot Studio */}
        <button
          type="button"
          onClick={handleClone}
          title="Clone to My Pack Studio"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-[#202c33] active:scale-95 transition-all cursor-pointer"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#25D366]" />
          <span className="hidden sm:inline">Studio</span>
        </button>

        {/* Share Pack Modal Trigger */}
        {onSharePack && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSharePack(pack);
            }}
            title="Share to WhatsApp & Socials"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] p-2.5 text-slate-700 dark:text-slate-300 shadow-xs hover:text-[#25D366] hover:bg-slate-50 dark:hover:bg-[#202c33] active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
