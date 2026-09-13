"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Sparkles,
  ArrowRight,
  Download,
  Copy,
  Layers,
  Palette,
  Eye,
  Check,
} from "lucide-react";
import { CURATED_EXPLORE_PACKS } from "../../src/data/exploreCatalog";
import { ExplorePack } from "../../src/types/explore";
import { convertExplorePackToStudioPack } from "../../utils/exploreEngine";
import { StickerPackRecord } from "../../src/types/pack";

interface SocialDiscoverySectionProps {
  onClonePack: (studioPack: StickerPackRecord) => void;
  onRemixSticker: (imageUrl: string, title?: string) => void;
  onExploreCommunity: () => void;
}

export function SocialDiscoverySection({
  onClonePack,
  onRemixSticker,
  onExploreCommunity,
}: SocialDiscoverySectionProps) {
  // Grab top 3 prominent packs to show in a clean 3-column linear card row
  const featuredPacks = CURATED_EXPLORE_PACKS.slice(0, 3);
  const [clonedPackId, setClonedPackId] = useState<string | null>(null);

  const handleClone = (pack: ExplorePack) => {
    const studioPack = convertExplorePackToStudioPack(pack);
    setClonedPackId(pack.id);
    onClonePack(studioPack);
    setTimeout(() => setClonedPackId(null), 3000);
  };

  return (
    <section className="relative w-full py-8 border-t border-slate-200/80 dark:border-white/10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500 font-['Space_Grotesk']">
            <Flame className="h-3.5 w-3.5" />
            <span>Community Creations</span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">
            Trending WhatsApp Sticker Packs
          </h2>
        </div>

        <button
          type="button"
          onClick={onExploreCommunity}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] px-4 py-2 font-['Space_Grotesk'] text-xs font-bold text-slate-900 dark:text-white hover:border-[#25D366] transition-all cursor-pointer shadow-sm"
        >
          <span>Browse All 12+ Packs</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#25D366]" />
        </button>
      </div>

      {/* 3-Column Linear Pack Cards (Strictly Linear Row, No Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredPacks.map((pack) => {
          const isJustCloned = clonedPackId === pack.id;

          return (
            <div
              key={pack.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-6 shadow-md transition-all hover:border-[#25D366]/40 hover:shadow-xl group"
            >
              <div>
                {/* Pack Category Badge & Likes */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 font-['Space_Grotesk']">
                    {pack.category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {pack.downloadCount.toLocaleString()} installs
                  </span>
                </div>

                {/* Title and Creator */}
                <h3 className="font-['Space_Grotesk'] text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-[#25D366] transition-colors">
                  {pack.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  by <strong className="text-slate-700 dark:text-slate-300">@{pack.creator.username}</strong>
                </p>

                {/* Sticker Strip Preview (4 preview stickers with remix actions) */}
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {pack.stickers.slice(0, 4).map((stk) => (
                    <div
                      key={stk.id}
                      className="relative aspect-square rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 p-1.5 flex items-center justify-center overflow-hidden group/stk"
                      title={stk.title || "Sticker"}
                    >
                      <img
                        src={stk.imageUrl}
                        alt={stk.title || "Sticker"}
                        className="w-full h-full object-contain transition-transform group-hover/stk:scale-110"
                        referrerPolicy="no-referrer"
                      />

                      {/* Hover Remix Shortcut */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemixSticker(stk.imageUrl, stk.title);
                        }}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover/stk:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black font-['Space_Grotesk'] transition-opacity cursor-pointer p-1 text-center"
                      >
                        <Palette className="h-3.5 w-3.5 mb-0.5 text-[#25D366]" />
                        <span>Remix</span>
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {pack.description}
                </p>
              </div>

              {/* Bottom Card Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleClone(pack)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-['Space_Grotesk'] text-xs font-bold transition-all cursor-pointer ${
                    isJustCloned
                      ? "bg-emerald-600 text-white"
                      : "bg-[#25D366] text-slate-950 hover:bg-[#20bd5a] active:scale-95 shadow-sm"
                  }`}
                >
                  {isJustCloned ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Cloned to Studio!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Clone to Studio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
