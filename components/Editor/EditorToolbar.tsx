"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Type,
  RotateCcw,
  Undo2,
  Redo2,
  Palette,
  Loader2,
  Eraser,
  Paintbrush,
  Wand2,
  Feather,
  MousePointer,
  Sliders,
  Check,
  Smile,
  ShieldAlert,
  Flame,
  MessageSquare,
} from "lucide-react";
import { ActiveTool, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from "../../hooks/useEditorState";
import { StickerOutlineConfig, OUTLINE_PRESETS } from "../../utils/stickerEffects";
import { POPULAR_MEME_PRESETS, MemeTextPreset } from "../../utils/memePresets";

export interface EditorToolbarProps {
  onRemoveBackground: () => void;
  onAddText: () => void;
  onResetCanvas: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoLabel?: string;
  redoLabel?: string;
  isAiProcessing?: boolean;
  hasImage?: boolean;
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  activeColorMode?: "fill" | "stroke";
  onToggleColorMode?: () => void;
  activeTool?: ActiveTool;
  onSelectTool?: (tool: ActiveTool) => void;
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
  outlineConfig?: StickerOutlineConfig;
  onToggleOutline?: () => void;
  onSelectOutlinePreset?: (presetConfig: StickerOutlineConfig) => void;
  onApplyMemePreset?: (preset: MemeTextPreset) => void;
}

const PRESET_COLORS = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#000000" },
  { name: "Neon Yellow", hex: "#facc15" },
  { name: "Coral Red", hex: "#f43f5e" },
  { name: "Hot Pink", hex: "#ec4899" },
  { name: "Cyber Purple", hex: "#a855f7" },
  { name: "Electric Cyan", hex: "#06b6d4" },
  { name: "Emerald Green", hex: "#10b981" },
];

const BRUSH_PRESETS = [10, 20, 35, 60, 90];

export function EditorToolbar({
  onRemoveBackground,
  onAddText,
  onResetCanvas,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  undoLabel,
  redoLabel,
  isAiProcessing = false,
  hasImage = true,
  selectedColor = "#ffffff",
  onSelectColor,
  activeColorMode = "fill",
  onToggleColorMode,
  activeTool = "SELECT",
  onSelectTool,
  brushSize = 20,
  onBrushSizeChange,
  outlineConfig,
  onToggleOutline,
  onSelectOutlinePreset,
  onApplyMemePreset,
}: EditorToolbarProps) {
  const [showOutlineMenu, setShowOutlineMenu] = React.useState(false);
  const [showMemeMenu, setShowMemeMenu] = React.useState(false);

  const isEraseActive = activeTool === "ERASE";
  const isRestoreActive = activeTool === "RESTORE";
  const isMagicEdgeActive = activeTool === "MAGIC_EDGE";
  const isFeatherActive = activeTool === "FEATHER";
  const isColorWandActive = activeTool === "COLOR_WAND";
  const isDrawingActive =
    isEraseActive || isRestoreActive || isMagicEdgeActive || isFeatherActive || isColorWandActive;

  const handleToolClick = (tool: ActiveTool) => {
    if (!onSelectTool) return;
    if (activeTool === tool) {
      onSelectTool("SELECT");
    } else {
      onSelectTool(tool);
    }
  };

  const getActiveToolLabel = () => {
    switch (activeTool) {
      case "ERASE":
        return "Eraser Size";
      case "RESTORE":
        return "Restore Size";
      case "MAGIC_EDGE":
        return "Magic Edge Size";
      case "FEATHER":
        return "Feather Brush Size";
      case "COLOR_WAND":
        return "Wand Scope";
      default:
        return "Brush Size";
    }
  };

  const getActiveToolColorTheme = () => {
    switch (activeTool) {
      case "ERASE":
        return {
          border: "border-rose-500/40 bg-white/95 dark:bg-rose-950/80 shadow-rose-500/10",
          iconBox: "border-rose-400 bg-rose-500/20 text-rose-500 dark:text-rose-300",
          badge: "border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-200",
          accent: "accent-rose-500 hover:accent-rose-400",
          pillActive: "border-rose-400 bg-rose-500 text-white",
          indicator: "bg-rose-400 shadow-[0_0_6px_#f43f5e]",
        };
      case "RESTORE":
        return {
          border: "border-cyan-500/40 bg-white/95 dark:bg-cyan-950/80 shadow-cyan-500/10",
          iconBox: "border-cyan-400 bg-cyan-500/20 text-cyan-600 dark:text-cyan-300",
          badge: "border-cyan-500/40 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200",
          accent: "accent-cyan-500 hover:accent-cyan-400",
          pillActive: "border-cyan-400 bg-cyan-500 text-white",
          indicator: "bg-cyan-400 shadow-[0_0_6px_#06b6d4]",
        };
      case "MAGIC_EDGE":
        return {
          border: "border-amber-500/40 bg-white/95 dark:bg-amber-950/80 shadow-amber-500/10",
          iconBox: "border-amber-400 bg-amber-500/20 text-amber-600 dark:text-amber-300",
          badge: "border-amber-500/40 bg-amber-500/20 text-amber-800 dark:text-amber-200",
          accent: "accent-amber-500 hover:accent-amber-400",
          pillActive: "border-amber-400 bg-amber-500 text-slate-900 font-bold",
          indicator: "bg-amber-400 shadow-[0_0_6px_#f59e0b]",
        };
      case "FEATHER":
        return {
          border: "border-purple-500/40 bg-white/95 dark:bg-purple-950/80 shadow-purple-500/10",
          iconBox: "border-purple-400 bg-purple-500/20 text-purple-600 dark:text-purple-300",
          badge: "border-purple-500/40 bg-purple-500/20 text-purple-800 dark:text-purple-200",
          accent: "accent-purple-500 hover:accent-purple-400",
          pillActive: "border-purple-400 bg-purple-500 text-white",
          indicator: "bg-purple-400 shadow-[0_0_6px_#a855f7]",
        };
      default:
        return {
          border: "border-emerald-500/40 bg-white/95 dark:bg-emerald-950/80 shadow-emerald-500/10",
          iconBox: "border-emerald-400 bg-emerald-500/20 text-emerald-600 dark:text-[#25D366]",
          badge: "border-emerald-500/40 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",
          accent: "accent-emerald-500 hover:accent-emerald-400",
          pillActive: "border-emerald-400 bg-emerald-500 text-white",
          indicator: "bg-emerald-400 shadow-[0_0_6px_#25D366]",
        };
    }
  };

  const toolTheme = getActiveToolColorTheme();

  return (
    <div className="relative z-30 flex flex-col items-center gap-2 max-w-full">
      {/* Primary Floating Toolbar Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-2 shadow-lg backdrop-blur-2xl transition-colors"
      >
        {/* 1. Selection Tool Button */}
        <motion.button
          id="toolbar-select-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => onSelectTool && onSelectTool("SELECT")}
          title="Select & Transform elements"
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTool === "SELECT"
              ? "bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border border-emerald-500/50 shadow-sm"
              : "bg-slate-100 dark:bg-[#202c33] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-[#2a3942]"
          }`}
        >
          <MousePointer className="h-4 w-4 text-[#25D366]" />
          <span className="hidden sm:inline">Select</span>
        </motion.button>

        {/* 2. Die-Cut White Outline Quick Preset Toggle */}
        <div className="relative">
          <motion.button
            id="toolbar-die-cut-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            disabled={!hasImage}
            onClick={() => setShowOutlineMenu((prev) => !prev)}
            title="Die-Cut White Sticker Outline & Shadow"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              !hasImage
                ? "bg-slate-100 dark:bg-[#202c33] text-slate-400 dark:text-zinc-500 border border-transparent cursor-not-allowed"
                : outlineConfig?.enabled
                ? "bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/50 shadow-sm"
                : "bg-slate-100 dark:bg-[#202c33] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-[#2a3942]"
            }`}
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[9px] font-black text-black shadow-sm">
              ✂
            </div>
            <span className="hidden md:inline">Die-Cut</span>
            {outlineConfig?.enabled && (
              <span className="rounded-full bg-amber-400/30 px-1 py-0.2 text-[10px] text-amber-900 dark:text-amber-200 font-bold">
                {outlineConfig.width}px
              </span>
            )}
          </motion.button>

          {/* Die-Cut Outline Dropdown Menu */}
          <AnimatePresence>
            {showOutlineMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-2 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1 transition-colors"
              >
                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span>Die-Cut Outline</span>
                  <button
                    type="button"
                    onClick={onToggleOutline}
                    className="text-xs font-semibold underline text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    {outlineConfig?.enabled ? "Turn Off" : "Turn On"}
                  </button>
                </div>

                {OUTLINE_PRESETS.map((preset) => {
                  const isCurrent =
                    outlineConfig?.enabled === preset.config.enabled &&
                    outlineConfig?.width === preset.config.width &&
                    outlineConfig?.color === preset.config.color;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectOutlinePreset && onSelectOutlinePreset(preset.config);
                        setShowOutlineMenu(false);
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                        isCurrent
                          ? "bg-amber-500/15 text-amber-950 dark:text-amber-100 border border-amber-500/40"
                          : "text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-slate-300 dark:border-white/30 shadow-sm"
                          style={{ backgroundColor: preset.config.color || "#ffffff" }}
                        />
                        <span>{preset.name}</span>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Magic Edge Cleaner */}
        <motion.button
          id="toolbar-magic-edge-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={!hasImage}
          onClick={() => handleToolClick("MAGIC_EDGE")}
          title="Magic Edge Cleaner (Removes edge fringe and background halos)"
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            !hasImage
              ? "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-transparent cursor-not-allowed"
              : isMagicEdgeActive
              ? "bg-amber-500/30 text-amber-800 dark:text-amber-200 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] font-extrabold"
              : "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-200"
          }`}
        >
          <Wand2
            className={`h-4 w-4 transition-transform ${
              isMagicEdgeActive ? "text-amber-500 scale-110" : "text-amber-500/80 group-hover:scale-110"
            }`}
          />
          <span className="hidden sm:inline">Magic Edge</span>
          {isMagicEdgeActive && (
            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
          )}
        </motion.button>

        {/* 4. Feather Edge Brush */}
        <motion.button
          id="toolbar-feather-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={!hasImage}
          onClick={() => handleToolClick("FEATHER")}
          title="Edge Feather Brush (Softens jagged steps with smooth anti-aliasing)"
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            !hasImage
              ? "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-transparent cursor-not-allowed"
              : isFeatherActive
              ? "bg-purple-500/30 text-purple-800 dark:text-purple-200 border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] font-extrabold"
              : "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:bg-purple-500/15 hover:border-purple-500/40 hover:text-purple-700 dark:hover:text-purple-200"
          }`}
        >
          <Feather
            className={`h-4 w-4 transition-transform ${
              isFeatherActive ? "text-purple-500 scale-110" : "text-purple-500/80 group-hover:scale-110"
            }`}
          />
          <span className="hidden sm:inline">Feather</span>
          {isFeatherActive && (
            <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
          )}
        </motion.button>

        {/* 5. Smart Eraser Tool Toggle Button */}
        <motion.button
          id="toolbar-erase-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={!hasImage}
          onClick={() => handleToolClick("ERASE")}
          title="Manual Eraser Tool (Click & drag on canvas to erase pixels)"
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            !hasImage
              ? "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-transparent cursor-not-allowed"
              : isEraseActive
              ? "bg-rose-500/30 text-rose-800 dark:text-rose-200 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] font-extrabold"
              : "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-200"
          }`}
        >
          <Eraser
            className={`h-4 w-4 transition-transform ${
              isEraseActive ? "text-rose-500 scale-110" : "text-rose-500/80 group-hover:scale-110"
            }`}
          />
          <span className="hidden sm:inline">Erase</span>
          {isEraseActive && (
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
          )}
        </motion.button>

        {/* 6. Restore Paintbrush Button (Rebalanced to Bright Cyan/Aqua) */}
        <motion.button
          id="toolbar-restore-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={!hasImage}
          onClick={() => handleToolClick("RESTORE")}
          title="Restore Tool (Click & drag on canvas to recover original photo pixels)"
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            !hasImage
              ? "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-transparent cursor-not-allowed"
              : isRestoreActive
              ? "bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)] font-extrabold"
              : "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-200"
          }`}
        >
          <Paintbrush
            className={`h-4 w-4 transition-transform ${
              isRestoreActive ? "text-cyan-500 scale-110" : "text-cyan-500/80 group-hover:scale-110"
            }`}
          />
          <span className="hidden sm:inline">Restore</span>
          {isRestoreActive && (
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          )}
        </motion.button>

        <div className="h-6 w-px bg-black/10 dark:bg-white/15 mx-0.5 hidden sm:block" />

        {/* 7. One-Click AI Background Removal (Rebalanced to Electric Cyan / Violet Gradient) */}
        <motion.button
          id="toolbar-ai-bg-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onRemoveBackground}
          disabled={isAiProcessing || !hasImage}
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-md cursor-pointer ${
            isAiProcessing
              ? "bg-purple-900/60 text-purple-200 border border-purple-500/40 cursor-wait"
              : !hasImage
              ? "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-transparent cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-indigo-500/25 border border-white/20 hover:brightness-110"
          }`}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {isAiProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
          ) : (
            <Sparkles className="h-4 w-4 text-cyan-200 animate-pulse" />
          )}
          <span className="whitespace-nowrap hidden md:inline">
            {isAiProcessing ? "Removing..." : "Auto AI"}
          </span>
        </motion.button>

        <div className="h-6 w-px bg-black/10 dark:bg-white/15 mx-0.5 hidden sm:block" />

        {/* 8. Meme Text & Bubble Presets Dropdown */}
        <div className="relative">
          <motion.button
            id="toolbar-meme-presets-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setShowMemeMenu((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-pink-500/30 bg-pink-500/15 px-2.5 py-2 text-xs font-bold text-pink-700 dark:text-pink-300 shadow-sm transition hover:bg-pink-500/25 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-pink-500" />
            <span className="whitespace-nowrap hidden sm:inline">Meme Presets</span>
          </motion.button>

          <AnimatePresence>
            {showMemeMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-2.5 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1.5 transition-colors"
              >
                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  Meme & Caption Presets
                </div>

                {POPULAR_MEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onApplyMemePreset && onApplyMemePreset(preset);
                      setShowMemeMenu(false);
                    }}
                    className="flex flex-col items-start rounded-xl px-2.5 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-[#202c33] cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{preset.name}</span>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400">{preset.description}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 9. Add Custom Text Button */}
        <motion.button
          id="toolbar-add-text-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onAddText}
          className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-white shadow-sm transition hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
        >
          <Type className="h-4 w-4 text-amber-500" />
          <span className="whitespace-nowrap hidden lg:inline">+ Text</span>
        </motion.button>

        {/* 10. Color Picker Palette */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-black/40 border border-black/10 dark:border-white/10 px-2 py-1">
          {onToggleColorMode && (
            <button
              type="button"
              onClick={onToggleColorMode}
              title={`Toggle color mode (Current: ${activeColorMode.toUpperCase()})`}
              className="flex items-center gap-1 mr-1 rounded-lg bg-black/5 dark:bg-white/10 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer"
            >
              <Palette className="h-3 w-3 text-pink-500" />
              <span className="hidden lg:inline">{activeColorMode}</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            {PRESET_COLORS.slice(0, 4).map((col) => {
              const isSelected = selectedColor.toLowerCase() === col.hex.toLowerCase();
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => onSelectColor && onSelectColor(col.hex)}
                  title={`${col.name} (${col.hex})`}
                  className={`relative h-4 w-4 sm:h-5 sm:w-5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#111b21] scale-110 shadow-lg"
                      : "opacity-80 hover:opacity-100 hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: col.hex,
                    border: col.hex === "#ffffff" ? "1px solid #ccc" : col.hex === "#000000" ? "1px solid #444" : "none",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="h-6 w-px bg-black/10 dark:bg-white/15 mx-0.5" />

        {/* 11. Global Undo Button */}
        <motion.button
          id="toolbar-undo-btn"
          whileHover={canUndo ? { scale: 1.08 } : {}}
          whileTap={canUndo ? { scale: 0.92 } : {}}
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title={undoLabel ? `Undo: ${undoLabel} (Ctrl+Z / ⌘Z)` : "Undo (Ctrl+Z / ⌘Z)"}
          className={`flex items-center gap-1 rounded-xl p-2 text-xs font-semibold transition ${
            canUndo
              ? "text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#202c33] cursor-pointer"
              : "text-slate-300 dark:text-zinc-600 opacity-40 cursor-not-allowed"
          }`}
        >
          <Undo2 className="h-4 w-4" />
        </motion.button>

        {/* 12. Global Redo Button */}
        <motion.button
          id="toolbar-redo-btn"
          whileHover={canRedo ? { scale: 1.08 } : {}}
          whileTap={canRedo ? { scale: 0.92 } : {}}
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title={redoLabel ? `Redo: ${redoLabel} (Ctrl+Shift+Z / ⇧⌘Z)` : "Redo (Ctrl+Shift+Z / ⇧⌘Z)"}
          className={`flex items-center gap-1 rounded-xl p-2 text-xs font-semibold transition ${
            canRedo
              ? "text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#202c33] cursor-pointer"
              : "text-slate-300 dark:text-zinc-600 opacity-40 cursor-not-allowed"
          }`}
        >
          <Redo2 className="h-4 w-4" />
        </motion.button>

        {/* 13. Comprehensive Reset Canvas Button */}
        <motion.button
          id="toolbar-reset-canvas-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onResetCanvas}
          title="Reset Canvas & Layer Options"
          className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-2 text-xs font-semibold text-red-600 dark:text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-red-500" />
          <span className="hidden xl:inline text-[11px] font-bold">Reset</span>
        </motion.button>
      </motion.div>

      {/* Dynamic Brush Size Slider Sub-Bar (Revealed when any brush tool is active) */}
      <AnimatePresence>
        {isDrawingActive && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, height: "auto", scale: 1 }}
            exit={{ opacity: 0, y: -8, height: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full flex items-center justify-center"
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-colors ${toolTheme.border}`}
            >
              {/* Tool Label & Live Brush Indicator Circle */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border ${toolTheme.iconBox}`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    {getActiveToolLabel()}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-mono font-bold ${toolTheme.badge}`}
                  >
                    {brushSize}px
                  </span>
                </div>
              </div>

              {/* Slider Input */}
              <div className="flex items-center gap-3 min-w-[170px] sm:min-w-[220px]">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{MIN_BRUSH_SIZE}px</span>
                <div className="relative flex-1 flex items-center">
                  <input
                    id="brush-size-slider"
                    type="range"
                    min={MIN_BRUSH_SIZE}
                    max={MAX_BRUSH_SIZE}
                    step={1}
                    value={brushSize}
                    onChange={(e) =>
                      onBrushSizeChange && onBrushSizeChange(Number(e.target.value))
                    }
                    className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-800 transition-all ${toolTheme.accent}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{MAX_BRUSH_SIZE}px</span>
              </div>

              {/* Quick Size Preset Pills */}
              <div className="hidden sm:flex items-center gap-1.5">
                {BRUSH_PRESETS.map((preset) => {
                  const isPresetActive = brushSize === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onBrushSizeChange && onBrushSizeChange(preset)}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                        isPresetActive
                          ? `${toolTheme.pillActive} shadow-md`
                          : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/15"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Live circular brush size preview icon */}
              <div
                title={`Brush Diameter: ${brushSize}px`}
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-black/40 border border-black/10 dark:border-white/10"
              >
                <div
                  className={`rounded-full transition-all ${toolTheme.indicator}`}
                  style={{
                    width: `${Math.max(4, Math.min(22, (brushSize / MAX_BRUSH_SIZE) * 22))}px`,
                    height: `${Math.max(4, Math.min(22, (brushSize / MAX_BRUSH_SIZE) * 22))}px`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EditorToolbar;
