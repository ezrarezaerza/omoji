"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Type,
  RotateCcw,
  Palette,
  Loader2,
  Eraser,
  Paintbrush,
  MousePointer,
  Sliders,
  Check,
} from "lucide-react";
import { ActiveTool, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from "../../hooks/useEditorState";

export interface EditorToolbarProps {
  onRemoveBackground: () => void;
  onAddText: () => void;
  onResetCanvas: () => void;
  isAiProcessing?: boolean;
  hasImage?: boolean;
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  activeColorMode?: "fill" | "stroke";
  onToggleColorMode?: () => void;
  // Phase 6.1: Tool selection & Brush state
  activeTool?: ActiveTool;
  onSelectTool?: (tool: ActiveTool) => void;
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
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
}: EditorToolbarProps) {
  const isEraseActive = activeTool === "ERASE";
  const isRestoreActive = activeTool === "RESTORE";
  const isDrawingActive = isEraseActive || isRestoreActive;

  const handleToolClick = (tool: ActiveTool) => {
    if (!onSelectTool) return;
    if (activeTool === tool) {
      onSelectTool("SELECT");
    } else {
      onSelectTool(tool);
    }
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[96%]">
      {/* Primary Floating Toolbar Bar */}
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl border border-white/20 bg-[#120f24]/90 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10"
      >
        {/* 1. Selection Tool Button */}
        <motion.button
          id="toolbar-select-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => onSelectTool && onSelectTool("SELECT")}
          title="Select & Transform elements"
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
            activeTool === "SELECT"
              ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50"
              : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white"
          }`}
        >
          <MousePointer className="h-4 w-4 text-cyan-400" />
          <span className="hidden sm:inline">Select</span>
        </motion.button>

        {/* 2. Smart Eraser Tool Toggle Button */}
        <motion.button
          id="toolbar-erase-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={!hasImage}
          onClick={() => handleToolClick("ERASE")}
          title="Manual Eraser Tool (Click & drag on canvas to erase pixels)"
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
            !hasImage
              ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
              : isEraseActive
              ? "bg-rose-500/30 text-rose-200 border-2 border-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.65)] ring-2 ring-rose-500/50 animate-pulse font-extrabold"
              : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-200"
          }`}
        >
          <Eraser
            className={`h-4 w-4 transition-transform ${
              isEraseActive ? "text-rose-400 scale-110" : "text-rose-400/80 group-hover:scale-110"
            }`}
          />
          <span>Erase</span>
          {isEraseActive && (
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
          )}
        </motion.button>

        {/* 3. Restore Paintbrush / Magic Wand Button */}
        <motion.button
          id="toolbar-restore-tool-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={!hasImage}
          onClick={() => handleToolClick("RESTORE")}
          title="Restore Tool (Click & drag on canvas to recover original photo pixels)"
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
            !hasImage
              ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
              : isRestoreActive
              ? "bg-emerald-500/30 text-emerald-200 border-2 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.65)] ring-2 ring-emerald-500/50 animate-pulse font-extrabold"
              : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-200"
          }`}
        >
          <Paintbrush
            className={`h-4 w-4 transition-transform ${
              isRestoreActive ? "text-emerald-400 scale-110" : "text-emerald-400/80 group-hover:scale-110"
            }`}
          />
          <span>Restore</span>
          {isRestoreActive && (
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          )}
        </motion.button>

        <div className="h-6 w-px bg-white/15 mx-0.5 hidden sm:block" />

        {/* 4. One-Click AI Background Removal */}
        <motion.button
          id="toolbar-ai-bg-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onRemoveBackground}
          disabled={isAiProcessing || !hasImage}
          className={`relative group flex items-center gap-1.5 overflow-hidden rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-md sm:text-sm ${
            isAiProcessing
              ? "bg-purple-900/60 text-purple-200 border border-purple-500/40 cursor-wait"
              : !hasImage
              ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-purple-900/40 hover:shadow-purple-600/30 border border-white/20"
          }`}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {isAiProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
          ) : (
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
          )}
          <span className="whitespace-nowrap hidden md:inline">
            {isAiProcessing ? "Removing..." : "Auto AI"}
          </span>
        </motion.button>

        <div className="h-6 w-px bg-white/15 mx-0.5 hidden sm:block" />

        {/* 5. Add Text Button */}
        <motion.button
          id="toolbar-add-text-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onAddText}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-white/25 hover:bg-white/15 sm:text-sm"
        >
          <Type className="h-4 w-4 text-amber-400" />
          <span className="whitespace-nowrap hidden sm:inline">Add Text</span>
        </motion.button>

        {/* 6. Color Picker Palette */}
        <div className="flex items-center gap-1 rounded-xl bg-black/40 border border-white/10 px-2 py-1">
          {onToggleColorMode && (
            <button
              type="button"
              onClick={onToggleColorMode}
              title={`Toggle color mode (Current: ${activeColorMode.toUpperCase()})`}
              className="flex items-center gap-1 mr-1 rounded-lg bg-white/10 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/20"
            >
              <Palette className="h-3 w-3 text-pink-400" />
              <span className="hidden lg:inline">{activeColorMode}</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            {PRESET_COLORS.slice(0, 5).map((col) => {
              const isSelected = selectedColor.toLowerCase() === col.hex.toLowerCase();
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => onSelectColor && onSelectColor(col.hex)}
                  title={`${col.name} (${col.hex})`}
                  className={`relative h-4 w-4 sm:h-5 sm:w-5 rounded-full transition-all ${
                    isSelected
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#120f24] scale-110 shadow-lg"
                      : "opacity-80 hover:opacity-100 hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: col.hex,
                    border: col.hex === "#ffffff" ? "1px solid #666" : col.hex === "#000000" ? "1px solid #444" : "none",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* 7. Reset Canvas Button */}
        <motion.button
          id="toolbar-reset-canvas-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onResetCanvas}
          title="Reset Canvas & Layers"
          className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-2 text-xs font-semibold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20"
        >
          <RotateCcw className="h-4 w-4 text-red-400" />
        </motion.button>
      </motion.div>

      {/* Dynamic Brush Size Slider Sub-Bar (Revealed when ERASE or RESTORE is active) */}
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
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-colors ${
                isEraseActive
                  ? "border-rose-500/40 bg-rose-950/70 shadow-rose-950/50"
                  : "border-emerald-500/40 bg-emerald-950/70 shadow-emerald-950/50"
              }`}
            >
              {/* Tool Label & Live Brush Indicator Circle */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
                    isEraseActive
                      ? "border-rose-400 bg-rose-500/20 text-rose-300"
                      : "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                    {isEraseActive ? "Eraser Size" : "Restore Size"}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-mono font-bold ${
                      isEraseActive
                        ? "border-rose-500/40 bg-rose-500/20 text-rose-200"
                        : "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {brushSize}px
                  </span>
                </div>
              </div>

              {/* Slider Input with HeroUI styling */}
              <div className="flex items-center gap-3 min-w-[170px] sm:min-w-[220px]">
                <span className="text-[10px] font-semibold text-zinc-400">{MIN_BRUSH_SIZE}px</span>
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
                    className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 transition-all ${
                      isEraseActive
                        ? "accent-rose-500 hover:accent-rose-400"
                        : "accent-emerald-500 hover:accent-emerald-400"
                    }`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-zinc-400">{MAX_BRUSH_SIZE}px</span>
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
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                        isPresetActive
                          ? isEraseActive
                            ? "border-rose-400 bg-rose-500 text-zinc-950 shadow-md"
                            : "border-emerald-400 bg-emerald-500 text-zinc-950 shadow-md"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15"
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
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-xl bg-black/40 border border-white/10"
              >
                <div
                  className={`rounded-full transition-all ${
                    isEraseActive ? "bg-rose-400 shadow-[0_0_6px_#f43f5e]" : "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  }`}
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
