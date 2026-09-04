"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  ShieldCheck,
  Smile,
  Moon,
  Sun,
  Grid,
  Sparkles,
  Maximize2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ChatPreviewMode = "checkerboard" | "whatsapp-light" | "whatsapp-dark";

interface WhatsAppPreviewControlsProps {
  showSafeZone: boolean;
  onToggleSafeZone: () => void;
  previewMode: ChatPreviewMode;
  onSelectPreviewMode: (mode: ChatPreviewMode) => void;
  selectedEmojis: string[];
  onSelectEmojis: (emojis: string[]) => void;
  onFitAndCenter?: () => void;
}

const COMMON_EMOJIS = [
  "✨", "🔥", "😂", "❤️", "😍", "🎉", "👏", "😎", "🥳", "🐶", "🐱", "🚀", "💀", "👍", "🙏", "💯"
];

export function WhatsAppPreviewControls({
  showSafeZone,
  onToggleSafeZone,
  previewMode,
  onSelectPreviewMode,
  selectedEmojis,
  onSelectEmojis,
  onFitAndCenter,
}: WhatsAppPreviewControlsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const toggleEmoji = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      const filtered = selectedEmojis.filter((e) => e !== emoji);
      onSelectEmojis(filtered.length > 0 ? filtered : ["✨"]);
    } else {
      // WhatsApp packs support up to 3 reaction emojis per sticker
      if (selectedEmojis.length >= 3) {
        onSelectEmojis([selectedEmojis[1], selectedEmojis[2], emoji]);
      } else {
        onSelectEmojis([...selectedEmojis, emoji]);
      }
    }
  };

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 p-2 backdrop-blur-sm">
      {/* Left: WhatsApp Chat Background Preview Selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
          Preview
        </span>

        <button
          type="button"
          onClick={() => onSelectPreviewMode("checkerboard")}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            previewMode === "checkerboard"
              ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Transparent Checkerboard"
        >
          <Grid className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Canvas</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPreviewMode("whatsapp-light")}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            previewMode === "whatsapp-light"
              ? "bg-[#E5DDD5] text-[#075E54] shadow-xs border border-amber-800/20 font-black"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Light WhatsApp Chat Simulation"
        >
          <Sun className="h-3.5 w-3.5 text-amber-600" />
          <span className="hidden md:inline">Light Chat</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPreviewMode("whatsapp-dark")}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            previewMode === "whatsapp-dark"
              ? "bg-[#0B141A] text-[#25D366] shadow-xs border border-emerald-500/30 font-black"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Dark WhatsApp Chat Simulation"
        >
          <Moon className="h-3.5 w-3.5 text-[#25D366]" />
          <span className="hidden md:inline">Dark Chat</span>
        </button>
      </div>

      {/* Right: Safe Zone Guide Toggle, Auto-Fit & Reaction Emoji */}
      <div className="flex items-center gap-1.5">
        {/* Fit & Center Trigger */}
        {onFitAndCenter && (
          <button
            type="button"
            onClick={onFitAndCenter}
            className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-200 hover:border-amber-500 hover:text-amber-500 dark:hover:text-amber-400 bg-white dark:bg-white/5 px-2 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Auto-Fit and center sticker within 16px WhatsApp safe zone"
          >
            <Maximize2 className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden xl:inline">Fit & Center</span>
          </button>
        )}

        {/* Safe-Zone Guide Toggle */}
        <button
          type="button"
          onClick={onToggleSafeZone}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            showSafeZone
              ? "bg-emerald-500/20 text-[#25D366] border border-emerald-500/30 font-black"
              : "border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/5"
          }`}
          title="Toggle WhatsApp 16px Safe Margin Overlay"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">16px Safe Zone</span>
        </button>

        {/* Reaction Emoji Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white hover:border-[#25D366] transition-all cursor-pointer shadow-xs"
            title="Choose sticker reaction emoji for WhatsApp keyboard"
          >
            <span className="text-sm">{selectedEmojis[0] || "✨"}</span>
            <Smile className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Emoji Popover */}
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] p-3 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      WhatsApp Reaction Emojis
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-xl">
                    {COMMON_EMOJIS.map((emoji) => {
                      const isSelected = selectedEmojis.includes(emoji);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleEmoji(emoji)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#25D366]/20 border border-[#25D366] scale-105"
                              : "hover:bg-slate-100 dark:hover:bg-white/10"
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
