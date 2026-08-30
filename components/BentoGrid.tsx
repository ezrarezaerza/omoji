"use client";

import React, { useState } from "react";
import {
  PlusCircle,
  Library,
  Flame,
  Sparkles,
  Upload,
  ArrowRight,
  Layers,
  Smile,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { BentoCard } from "./BentoCard";

export interface BentoGridProps {
  onOpenEditor?: () => void;
}

export function BentoGrid({ onOpenEditor }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
      {/* Card 1 (Hero/Upload): Spans 2 columns and 2 rows */}
      <BentoCard
        className="md:col-span-2 md:row-span-2 min-h-[420px] justify-between border-orange-500/30 bg-gradient-to-b from-white/[0.12] to-white/[0.04]"
        title="Create a New Sticker Pack"
        subtitle="Turn your photos, memes, and pet pictures into WhatsApp stickers"
        icon={PlusCircle}
        badge="1-Click Magic"
        onClick={onOpenEditor}
      >
        <div className="flex h-full flex-col justify-between pt-2">
          {/* Interactive Upload/Dropzone Area */}
          <div
            onClick={onOpenEditor}
            className="group/drop relative mt-2 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/25 bg-black/20 p-8 text-center transition-all duration-300 hover:border-orange-400/60 hover:bg-orange-500/[0.05] cursor-pointer"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-zinc-950 shadow-lg shadow-orange-500/30 transition-transform group-hover/drop:scale-110">
              <Upload className="h-7 w-7" />
            </div>

            <h4 className="mt-4 text-lg font-bold text-white">
              Drop your photo here or click to start
            </h4>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Works with JPG, PNG, or WEBP photos. We'll automatically remove the background and add clean outlines.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                <Wand2 className="h-3.5 w-3.5 text-orange-400" /> Auto Cutout
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                <Layers className="h-3.5 w-3.5 text-purple-400" /> Custom Outlines
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                <Smile className="h-3.5 w-3.5 text-emerald-400" /> 1-Tap WhatsApp Export
              </span>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-zinc-400">
              <span className="font-semibold text-white">3 to 30 stickers</span> per pack
            </div>
            <button
              id="start-pack-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenEditor) onOpenEditor();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-orange-500/25 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Start Creating
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </BentoCard>

      {/* Card 2 (Recent): Spans 2 columns */}
      <BentoCard
        className="md:col-span-2 min-h-[220px]"
        title="My Sticker Packs"
        subtitle="Manage and export your custom creations"
        icon={Library}
        badge="3 Active"
      >
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="group/item relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-all duration-200 hover:border-white/20 hover:bg-white/10">
            <div className="flex items-center justify-between">
              <span className="text-2xl">😎</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                Ready
              </span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-white">Daily Memes</div>
              <div className="text-[11px] text-zinc-400">18 stickers • Ready to send</div>
            </div>
          </div>

          <div className="group/item relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-all duration-200 hover:border-white/20 hover:bg-white/10">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🐱</span>
              <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
                Draft
              </span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-white">Cat Reactions</div>
              <div className="text-[11px] text-zinc-400">8 stickers • In progress</div>
            </div>
          </div>

          <div className="group/item hidden flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-all duration-200 hover:border-white/20 hover:bg-white/10 sm:flex">
            <div className="flex items-center justify-between">
              <span className="text-2xl">✨</span>
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                Ready
              </span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-white">Party Vibes</div>
              <div className="text-[11px] text-zinc-400">24 stickers • Saved</div>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Card 3 (Trending/Explore): Span 1 column */}
      <BentoCard
        className="md:col-span-1 min-h-[200px]"
        title="Popular Packs"
        subtitle="Hot community favorites"
        icon={Flame}
        badge="Popular"
      >
        <div className="mt-2 flex flex-col gap-2.5">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-xs font-bold text-white">Funny Slang</p>
                <p className="text-[10px] text-zinc-400">14.2k downloads</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-orange-400">+98%</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🐶</span>
              <div>
                <p className="text-xs font-bold text-white">Happy Dogs</p>
                <p className="text-[10px] text-zinc-400">9.8k downloads</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-orange-400">+64%</span>
          </div>
        </div>
      </BentoCard>

      {/* Card 4 (Explore / AI Magic): Span 1 column */}
      <BentoCard
        className="md:col-span-1 min-h-[200px]"
        title="Easy Tools"
        subtitle="Everything you need"
        icon={Sparkles}
        badge="Included"
      >
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-purple-500/15 p-2.5 text-xs text-purple-200 border border-purple-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400" />
            <span>Automatic Photo Cutout</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-orange-500/15 p-2.5 text-xs text-orange-200 border border-orange-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-400" />
            <span>Crisp Sticker Outlines</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 p-2.5 text-xs text-emerald-200 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>WhatsApp Ready Format</span>
          </div>
        </div>
      </BentoCard>
    </div>
  );
}

export default BentoGrid;
