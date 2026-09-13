"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Smartphone,
  Layers,
  ShieldCheck,
  Flame,
  Laugh,
  CheckCircle2,
  Sticker,
  Palette,
} from "lucide-react";

interface LandingHeroProps {
  onStartPack: (packTitle: string) => void;
  onOpenCanvas: () => void;
  onExploreCommunity: () => void;
  defaultCreatorName?: string;
}

const QUICK_VIBE_IDEAS = [
  { label: "Dank Memes", icon: "🔥", title: "Weekend Dank Memes" },
  { label: "Doggo & Pets", icon: "🐶", title: "Fluffy Good Boys" },
  { label: "Group Chat Banter", icon: "⚡", title: "Squad Reactions" },
  { label: "Daily Moods", icon: "☕", title: "Monday Morning Moods" },
];

export function LandingHero({
  onStartPack,
  onOpenCanvas,
  onExploreCommunity,
  defaultCreatorName = "Sticker Creator",
}: LandingHeroProps) {
  const [packNameInput, setPackNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = packNameInput.trim();
    if (!cleanTitle) {
      setInputError("Please enter a name for your sticker pack");
      return;
    }
    setInputError(null);
    setIsSubmitting(true);
    onStartPack(cleanTitle);
  };

  const handleSelectVibe = (title: string) => {
    setPackNameInput(title);
    setInputError(null);
  };

  return (
    <section className="relative w-full pt-2 pb-8 sm:pb-12">
      {/* Decorative ambient emerald lighting */}
      <div className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/15" />

      <div className="flex flex-col items-center text-center">
        {/* Top Feature Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-[#25D366] shadow-xs backdrop-blur-md"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#25D366]" />
          <span>Easy WhatsApp Export • AI Auto-Cutout</span>
        </motion.div>

        {/* High-Impact Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-4xl font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]"
        >
          Turn Any Photo Into{" "}
          <span className="bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#128C7E] bg-clip-text text-transparent">
            WhatsApp Stickers
          </span>
          .
        </motion.h1>

        {/* Subtitle & Value Proposition */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-5 max-w-2xl text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300 leading-relaxed"
        >
          One-click AI background removal, custom die-cut sticker outlines, and meme captions.
          Build custom sticker packs ready to <strong>export straight to WhatsApp</strong> in seconds.
        </motion.p>

        {/* ============================================================ */}
        {/* ONE-TAP PACK KICKSTARTER (Replacing Quick Dropzone) */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="relative rounded-3xl border-2 border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#111b21]/95 p-3 sm:p-4 shadow-xl backdrop-blur-xl transition-all hover:border-[#25D366]/40 dark:hover:border-[#25D366]/40">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Sticker className="h-5 w-5 text-[#25D366]" />
                </div>
                <input
                  id="pack-kickstarter-input"
                  type="text"
                  value={packNameInput}
                  onChange={(e) => {
                    setPackNameInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="Enter pack name (e.g. Squad Banter, Cat Memes)..."
                  maxLength={40}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] py-3.5 pl-11 pr-4 font-['Space_Grotesk'] text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#25D366] focus:outline-hidden focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-['Space_Grotesk'] text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-[#20bd5a] active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <span>Start Sticker Pack</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            </form>

            {inputError && (
              <p className="mt-2 text-left pl-3 text-xs font-semibold text-red-500">
                {inputError}
              </p>
            )}

            {/* Quick Vibe Suggestions */}
            <div className="mt-3.5 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-white/5 pt-3">
              <span className="font-['Space_Grotesk'] text-xs font-bold text-slate-400 dark:text-slate-500">
                Popular vibes:
              </span>
              {QUICK_VIBE_IDEAS.map((vibe) => (
                <button
                  key={vibe.label}
                  type="button"
                  onClick={() => handleSelectVibe(vibe.title)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#182229]/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#25D366]/50 hover:text-[#25D366] transition-all cursor-pointer font-['Space_Grotesk']"
                >
                  <span>{vibe.icon}</span>
                  <span>{vibe.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Secondary Shortcuts */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold font-['Space_Grotesk']">
            <button
              type="button"
              onClick={onOpenCanvas}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5 text-[#25D366]" />
              <span>Or jump straight into Freeform Canvas</span>
            </button>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <button
              type="button"
              onClick={onExploreCommunity}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Browse 100+ Community Stickers</span>
            </button>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* KEY CAPABILITIES SUMMARY ROW (Linear High-Contrast, NO Bento) */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 grid w-full max-w-4xl grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#111b21]/70 p-4 text-center shadow-sm backdrop-blur-xs">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-[#25D366]">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div className="font-['Space_Grotesk'] text-sm font-black text-slate-900 dark:text-white">
              Sticker Packs
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Up to 30 per collection
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#111b21]/70 p-4 text-center shadow-sm backdrop-blur-xs">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-[#25D366]">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div className="font-['Space_Grotesk'] text-sm font-black text-slate-900 dark:text-white">
              AI Auto-Cutout
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Neural background removal
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#111b21]/70 p-4 text-center shadow-sm backdrop-blur-xs">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-[#25D366]">
              <Smartphone className="h-4.5 w-4.5" />
            </div>
            <div className="font-['Space_Grotesk'] text-sm font-black text-slate-900 dark:text-white">
              1-Tap Export
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Direct to WhatsApp
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#111b21]/70 p-4 text-center shadow-sm backdrop-blur-xs">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-[#25D366]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div className="font-['Space_Grotesk'] text-sm font-black text-slate-900 dark:text-white">
              Cloud Synced
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Online database persistence
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
