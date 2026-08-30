"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Layers,
  ChevronRight,
  FolderArchive,
} from "lucide-react";

export interface PackSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  packName: string;
  onPackNameChange: (name: string) => void;
  authorName: string;
  onAuthorNameChange: (author: string) => void;
  stickers: string[];
  onRemoveSticker: (index: number) => void;
  onAddCurrentSticker?: () => void;
  onFinalizePack: () => void;
}

export function PackSidebar({
  isOpen,
  onClose,
  packName,
  onPackNameChange,
  authorName,
  onAuthorNameChange,
  stickers,
  onRemoveSticker,
  onAddCurrentSticker,
  onFinalizePack,
}: PackSidebarProps) {
  const count = stickers.length;
  const isMinReached = count >= 3;
  const progressPercent = Math.min(100, Math.round((count / 30) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Slide-out Sidebar Panel */}
          <motion.aside
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-sm sm:max-w-md flex-col border-l border-white/15 bg-[#100d23]/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md shadow-purple-600/30">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Your Sticker Pack</h3>
                  <p className="text-[11px] text-white/50">WhatsApp Sticker Collection</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pack Metadata Configuration */}
            <div className="border-b border-white/10 p-5 space-y-3 bg-black/20">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-1">
                  Pack Name
                </label>
                <input
                  type="text"
                  value={packName}
                  onChange={(e) => onPackNameChange(e.target.value)}
                  placeholder="e.g. Cat Memes Vol. 1"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-1">
                  Creator Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => onAuthorNameChange(e.target.value)}
                  placeholder="e.g. Omoji Studio"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Progress Counter Pill */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white/80">
                    Stickers: <span className="text-purple-400 font-bold">{count}</span>/30
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      isMinReached
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {isMinReached ? "Ready for WhatsApp" : "Min 3 Recommended"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isMinReached
                        ? "bg-gradient-to-r from-green-500 to-emerald-400"
                        : "bg-gradient-to-r from-amber-500 to-orange-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Bento Grid of Stickers */}
            <div className="flex-1 overflow-y-auto p-5">
              {count === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/10 bg-white/5">
                  <Layers className="h-10 w-10 text-white/20 mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">No Stickers Added Yet</h4>
                  <p className="text-xs text-white/50 max-w-xs mb-4">
                    Create stickers on the canvas and click "Add to Current Pack" to start building your collection.
                  </p>
                  {onAddCurrentSticker && (
                    <button
                      onClick={onAddCurrentSticker}
                      className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-600/30"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Current Canvas</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/70">
                      Stickers in Pack ({count})
                    </span>
                    {onAddCurrentSticker && count < 30 && (
                      <button
                        onClick={onAddCurrentSticker}
                        className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Canvas</span>
                      </button>
                    )}
                  </div>

                  {/* 3-Column Bento Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {stickers.map((dataUrl, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-black/40 p-1.5 shadow-md hover:border-purple-500/50 transition-all"
                      >
                        {/* Checkerboard transparency background */}
                        <div
                          className="h-full w-full rounded-lg bg-cover bg-center flex items-center justify-center p-1"
                          style={{
                            backgroundImage: `
                              linear-gradient(45deg, #1f1b33 25%, transparent 25%), 
                              linear-gradient(-45deg, #1f1b33 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #1f1b33 75%), 
                              linear-gradient(-45deg, transparent 75%, #1f1b33 75%)
                            `,
                            backgroundSize: "12px 12px",
                            backgroundColor: "#0d0a1a",
                          }}
                        >
                          <img
                            src={dataUrl}
                            alt={`Sticker #${idx + 1}`}
                            className="max-h-full max-w-full object-contain drop-shadow-md"
                          />
                        </div>

                        {/* Index Badge */}
                        <span className="absolute top-2 left-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-sm">
                          #{idx + 1}
                        </span>

                        {/* Remove Action on Hover */}
                        <button
                          onClick={() => onRemoveSticker(idx)}
                          title="Remove sticker from pack"
                          className="absolute top-2 right-2 rounded-md bg-red-600/80 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all shadow-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Finalize CTA */}
            <div className="border-t border-white/10 bg-[#0c0919] p-5">
              <motion.button
                id="sidebar-finalize-pack-btn"
                whileHover={{ scale: count > 0 ? 1.02 : 1 }}
                whileTap={{ scale: count > 0 ? 0.98 : 1 }}
                onClick={onFinalizePack}
                disabled={count === 0}
                className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold text-white transition-all shadow-xl ${
                  count === 0
                    ? "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                    : isMinReached
                    ? "bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 shadow-green-600/30 hover:shadow-green-600/50 border border-green-400/40"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-600/30 hover:shadow-purple-600/50 border border-white/20"
                }`}
              >
                <FolderArchive className="h-4 w-4" />
                <span>Finalize Pack ({count}/30)</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </motion.button>

              {!isMinReached && count > 0 && (
                <p className="mt-2 text-center text-[10px] text-amber-400/90 font-medium">
                  ⚠️ WhatsApp recommends minimum 3 stickers per pack.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
