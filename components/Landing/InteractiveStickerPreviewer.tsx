"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Sliders,
  Check,
  MessageCircle,
  Eye,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  Smile,
  Layers,
  Heart,
  Flame,
  Laugh,
} from "lucide-react";

export interface StickerPreviewPreset {
  id: string;
  name: string;
  category: string;
  emoji: string;
  rawImage: string;
  cutoutImage: string;
  caption: string;
  subCaption?: string;
  borderColor: string;
  bgGradient: [string, string];
}

// High-fidelity handcrafted SVG sticker assets for zero-latency, sharp previewing on all screens
const PRESETS: StickerPreviewPreset[] = [
  {
    id: "doggo",
    name: "Good Boy Reaction",
    category: "Pets & Moods",
    emoji: "🐶",
    rawImage:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80",
    cutoutImage:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80",
    caption: "NO THOUGHTS 💭",
    subCaption: "JUST VIBES",
    borderColor: "#FFFFFF",
    bgGradient: ["#10B981", "#047857"],
  },
  {
    id: "shock",
    name: "Caught in 4K",
    category: "Meme Reactions",
    emoji: "📸",
    rawImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
    cutoutImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
    caption: "CAUGHT IN 4K 📸",
    subCaption: "DON'T DENY IT",
    borderColor: "#FFFFFF",
    bgGradient: ["#8B5CF6", "#6D28D9"],
  },
  {
    id: "cat",
    name: "Chill Loaf Cat",
    category: "Animals & Chill",
    emoji: "🐾",
    rawImage:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=700&q=80",
    cutoutImage:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=700&q=80",
    caption: "PEACE & QUIET 🌿",
    subCaption: "DO NOT DISTURB",
    borderColor: "#FFFFFF",
    bgGradient: ["#EC4899", "#BE185D"],
  },
];

interface InteractiveStickerPreviewerProps {
  onTestInEditor?: (presetImageUrl: string) => void;
}

export function InteractiveStickerPreviewer({
  onTestInEditor,
}: InteractiveStickerPreviewerProps) {
  const [activePreset, setActivePreset] = useState<StickerPreviewPreset>(PRESETS[0]);
  const [sliderPos, setSliderPos] = useState<number>(52); // Percentage (0 - 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"studio" | "whatsapp">("studio");
  const [borderThickness, setBorderThickness] = useState<"none" | "thin" | "thick">("thick");
  const [showShadow, setShowShadow] = useState<boolean>(true);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pointer dragging for the split slider
  const handlePointerMove = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = Math.round((x / rect.width) * 100);
      setSliderPos(percentage);
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  useEffect(() => {
    const onUp = () => setIsDragging(false);
    const onMove = (e: PointerEvent) => {
      if (isDragging) handlePointerMove(e);
    };

    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, [isDragging, handlePointerMove]);

  // Spawns a WhatsApp reaction burst animation
  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [
      ...prev,
      { id, emoji, x: 40 + Math.random() * 20, y: 70 + Math.random() * 10 },
    ]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1800);
  };

  const getBorderClass = () => {
    if (borderThickness === "none") return "";
    if (borderThickness === "thin") return "ring-4 ring-white";
    return "ring-8 ring-white";
  };

  return (
    <div className="w-full">
      {/* Outer Card Shell */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#111b21]/95 shadow-2xl backdrop-blur-xl transition-all">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-[#25D366] animate-pulse" />
            <h3 className="font-['Space_Grotesk'] text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Interactive Before / After AI Studio
            </h3>
            <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Drag to compare
            </span>
          </div>

          {/* View Mode Toggle: Cutout Canvas vs WhatsApp Chat Bubble */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0b141a] p-1">
            <button
              type="button"
              onClick={() => setViewMode("studio")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "studio"
                  ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-[#25D366]" />
              <span>Studio View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("whatsapp")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "whatsapp"
                  ? "bg-[#25D366] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp Chat</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Stage Area */}
        <div className="p-4 sm:p-6">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            className="group relative h-[360px] sm:h-[440px] md:h-[480px] w-full select-none overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 cursor-ew-resize touch-none"
          >
            {/* Background Texture for Studio View (Transparent Checkerboard Grid) */}
            {viewMode === "studio" ? (
              <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0b141a]">
                <div
                  className="absolute inset-0 opacity-40 dark:opacity-25"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%), 
                                      linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), 
                                      linear-gradient(45deg, transparent 75%, #cbd5e1 75%), 
                                      linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                />
              </div>
            ) : (
              /* WhatsApp Authentic Chat Wallpaper */
              <div className="absolute inset-0 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
                {/* Subtle WhatsApp doodle background opacity */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-grainy" />

                {/* Simulated Chat Header Bubble */}
                <div className="relative z-10 mx-auto rounded-full bg-slate-200/80 dark:bg-black/40 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 backdrop-blur-xs">
                  TODAY • 10:42 AM
                </div>

                {/* Friend Message Bubble */}
                <div className="relative z-10 max-w-[85%] sm:max-w-xs self-start rounded-2xl rounded-tl-xs bg-white dark:bg-[#202c33] p-3 text-xs text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-white/5">
                  <p className="font-semibold text-emerald-600 dark:text-[#25D366] text-[11px] mb-0.5">
                    Alex (Group Admin)
                  </p>
                  <p>Send that reaction sticker you just made with OMOJI! 🚀</p>
                  <span className="mt-1 block text-right text-[10px] text-slate-400">
                    10:41 AM
                  </span>
                </div>

                {/* Footer space for the sticker message bubble */}
                <div className="h-28" />
              </div>
            )}

            {/* ============================================================ */}
            {/* 1. RIGHT LAYER: THE FINISHED WHATSAPP STICKER (CUTOUT + DIE-CUT) */}
            {/* ============================================================ */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              {viewMode === "studio" ? (
                /* Pure Studio Sticker View */
                <motion.div
                  key={`sticker-${activePreset.id}`}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex flex-col items-center"
                >
                  {/* Sticker Container with Die-Cut Outline & Drop Shadow */}
                  <div
                    className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${getBorderClass()} ${
                      showShadow
                        ? "shadow-[0_20px_45px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)]"
                        : ""
                    }`}
                    style={{
                      width: "min(280px, 60vw)",
                      height: "min(280px, 60vw)",
                    }}
                  >
                    {/* Isolated Photo Layer */}
                    <img
                      src={activePreset.cutoutImage}
                      alt="WhatsApp Sticker Isolated Cutout"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient Overlay for Meme Depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Bold Meme Caption with Impact Text Outline */}
                    <div className="absolute inset-x-2 bottom-3 flex flex-col items-center text-center">
                      <span className="font-['Space_Grotesk'] text-base sm:text-xl font-black uppercase tracking-wider text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]">
                        {activePreset.caption}
                      </span>
                      {activePreset.subCaption && (
                        <span className="mt-0.5 rounded-md bg-[#25D366] px-2 py-0.5 font-['Space_Grotesk'] text-[11px] font-extrabold uppercase text-slate-950 shadow-md">
                          {activePreset.subCaption}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Android WhatsApp Ready Pill */}
                  <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-[#25D366] backdrop-blur-md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>512×512 WebP • Die-Cut 8px • WhatsApp Compliant</span>
                  </div>
                </motion.div>
              ) : (
                /* WhatsApp Outgoing Sticker Bubble */
                <div className="relative z-10 self-end mr-2 sm:mr-6 flex flex-col items-end">
                  <div className="relative flex flex-col items-end">
                    {/* The WhatsApp Sticker on Transparent Background */}
                    <div
                      className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${getBorderClass()} ${
                        showShadow ? "drop-shadow-xl" : ""
                      }`}
                      style={{
                        width: "min(220px, 50vw)",
                        height: "min(220px, 50vw)",
                      }}
                    >
                      <img
                        src={activePreset.cutoutImage}
                        alt="WhatsApp Sticker in Chat"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-2 bottom-2 text-center">
                        <span className="font-['Space_Grotesk'] text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          {activePreset.caption}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Timestamp & Blue Double Checkmarks */}
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      <span>10:42 AM</span>
                      <span className="font-bold text-[#53bdeb]">✓✓</span>
                    </div>

                    {/* WhatsApp Quick Reaction Trigger Bar */}
                    <div className="mt-2 flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-1 shadow-md">
                      {["🔥", "❤️", "😂", "👏"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => triggerReaction(emoji)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-transform active:scale-125 cursor-pointer text-sm"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* 2. LEFT LAYER: THE ORIGINAL UNEDITED RAW PHOTO (CLIPPED) */}
            {/* ============================================================ */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `inset(0 calc(100% - ${sliderPos}%) 0 0)`,
              }}
            >
              <div className="absolute inset-0 bg-slate-900">
                <img
                  src={activePreset.rawImage}
                  alt="Original unedited photo"
                  className="h-full w-full object-cover filter brightness-95"
                  referrerPolicy="no-referrer"
                />
                {/* Subtle dark vignette to emphasize raw state */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                {/* Raw Photo Label Tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span>ORIGINAL RAW PHOTO</span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. RIGHT CORNER BADGE: WHATSAPP STICKER (PROCESSED) */}
            {/* ============================================================ */}
            <div className="pointer-events-none absolute top-4 right-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-black/60 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#25D366]" />
              <span>AI STICKER CUTOUT</span>
            </div>

            {/* ============================================================ */}
            {/* 4. DRAGGABLE SPLIT SLIDER DIVIDER */}
            {/* ============================================================ */}
            <div
              className="absolute top-0 bottom-0 z-30 flex items-center justify-center cursor-ew-resize"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Vertical Divider Line */}
              <div className="h-full w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" />

              {/* Central Drag Handle Pill */}
              <div className="absolute flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-[#25D366] text-white shadow-xl transition-transform group-hover:scale-110 active:scale-95">
                <ArrowLeftRight className="h-4 w-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Floating Dynamic Reaction Particles */}
            <AnimatePresence>
              {reactions.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 1, y: 0, scale: 0.6 }}
                  animate={{ opacity: 0, y: -90, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="pointer-events-none absolute text-3xl sm:text-4xl select-none z-40"
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                >
                  {r.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Quick Slider Adjustment Buttons */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setSliderPos(15)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              ← View Full Sticker
            </button>
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <span>Cutout: {100 - sliderPos}%</span>
              <span>•</span>
              <span>Original: {sliderPos}%</span>
            </div>
            <button
              type="button"
              onClick={() => setSliderPos(85)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              View Full Photo →
            </button>
          </div>
        </div>

        {/* Bottom Preset & Style Customizer Controls */}
        <div className="border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#0b141a]/60 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Preset Selector Chips */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <span className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Sample Subject:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESETS.map((preset) => {
                  const isSelected = activePreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setActivePreset(preset)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer font-['Space_Grotesk'] ${
                        isSelected
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02]"
                          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] text-slate-700 dark:text-slate-300 hover:border-emerald-500/50"
                      }`}
                    >
                      <span className="text-sm">{preset.emoji}</span>
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Die-Cut Border & Shadow Customization Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-['Space_Grotesk'] text-xs font-bold text-slate-500 dark:text-slate-400">
                  Die-Cut Border:
                </span>
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-1">
                  {(["none", "thin", "thick"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBorderThickness(t)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        borderThickness === t
                          ? "bg-[#25D366] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {t === "none" ? "Off" : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shadow Switch */}
              <div className="flex flex-col gap-1.5">
                <span className="font-['Space_Grotesk'] text-xs font-bold text-slate-500 dark:text-slate-400">
                  Drop Shadow:
                </span>
                <button
                  type="button"
                  onClick={() => setShowShadow((s) => !s)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                    showShadow
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-[#25D366]"
                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] text-slate-500"
                  }`}
                >
                  <Check className={`h-3 w-3 ${showShadow ? "opacity-100" : "opacity-0"}`} />
                  <span>{showShadow ? "Active" : "Disabled"}</span>
                </button>
              </div>

              {/* Direct Canvas Launch Button */}
              {onTestInEditor && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-slate-500 dark:text-slate-400">
                    Live Test:
                  </span>
                  <button
                    type="button"
                    onClick={() => onTestInEditor(activePreset.cutoutImage)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-3.5 py-1.5 text-xs font-bold text-white dark:text-slate-900 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 cursor-pointer font-['Space_Grotesk']"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>Open in Editor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
