"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Eraser,
  Paintbrush,
  Sparkles,
  Sliders,
  Scissors,
  RotateCcw,
  Undo2,
  Redo2,
  ZoomIn,
  Eye,
  Check,
  Minimize2,
  Maximize2,
  Feather,
  Layers,
  Flame,
  MousePointer,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { ActiveTool, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from "../../hooks/useEditorState";
import {
  autoDeFringeCutout,
  autoSmoothCutoutEdges,
  chokeCutoutEdge,
  expandCutoutEdge,
} from "../../utils/edgeRefinement";

export interface RefinementStudioCardProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushHardness: number;
  onBrushHardnessChange: (hardness: number) => void;
  brushOpacity: number;
  onBrushOpacityChange: (opacity: number) => void;
  tolerance: number;
  onToleranceChange: (tol: number) => void;
  ghostOverlayOpacity: number;
  onGhostOverlayChange: (opacity: number) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  // Stroke history actions
  strokeCount: number;
  onUndoStroke: () => void;
  onRedoStroke: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearStrokes: () => void;
  // 1-Click Operations
  activeImageUrl: string | null;
  onApplyModifiedImage: (newUrl: string, message: string) => void;
  disabled?: boolean;
}

const BRUSH_TOOLS: {
  id: ActiveTool;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  desc: string;
}[] = [
  {
    id: "MAGIC_EDGE",
    label: "Magic Edge Cleaner",
    shortLabel: "Magic Edge",
    icon: Wand2,
    color: "from-amber-500 to-orange-500",
    desc: "Cleans background halos and edge fringe with smart contrast",
  },
  {
    id: "FEATHER",
    label: "Edge Feather Brush",
    shortLabel: "Feather",
    icon: Feather,
    color: "from-purple-500 to-pink-500",
    desc: "Softens jagged boundaries with smooth anti-aliasing",
  },
  {
    id: "ERASE",
    label: "Precision Eraser",
    shortLabel: "Eraser",
    icon: Eraser,
    color: "from-rose-500 to-red-600",
    desc: "Manually erases unwanted pixels and background spots",
  },
  {
    id: "RESTORE",
    label: "Photo Restore Brush",
    shortLabel: "Restore",
    icon: Paintbrush,
    color: "from-emerald-500 to-teal-500",
    desc: "Recovers original photo pixels under the brush stroke",
  },
  {
    id: "COLOR_WAND",
    label: "Magic Color Wand",
    shortLabel: "Color Wand",
    icon: Sparkles,
    color: "from-cyan-500 to-blue-500",
    desc: "Click on remnant color spots to auto-erase matching hues",
  },
];

export function RefinementStudioCard({
  activeTool,
  onSelectTool,
  brushSize,
  onBrushSizeChange,
  brushHardness,
  onBrushHardnessChange,
  brushOpacity,
  onBrushOpacityChange,
  tolerance,
  onToleranceChange,
  ghostOverlayOpacity,
  onGhostOverlayChange,
  zoomLevel,
  onZoomChange,
  strokeCount,
  onUndoStroke,
  onRedoStroke,
  canUndo,
  canRedo,
  onClearStrokes,
  activeImageUrl,
  onApplyModifiedImage,
  disabled = false,
}: RefinementStudioCardProps) {
  const [activeTab, setActiveTab] = useState<"brush" | "one-click" | "inspection">("brush");
  const [isProcessingOp, setIsProcessingOp] = useState<string | null>(null);

  // Helper to run 1-click pixel operations
  const handleRun1ClickOp = async (
    opName: string,
    opFn: (img: HTMLImageElement) => Promise<string>,
    successMsg: string
  ) => {
    if (!activeImageUrl || isProcessingOp) return;
    setIsProcessingOp(opName);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activeImageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const updatedDataUrl = await opFn(img);
      onApplyModifiedImage(updatedDataUrl, successMsg);
    } catch (err) {
      console.error(`Failed to execute ${opName}:`, err);
    } finally {
      setIsProcessingOp(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111b21] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Refinement Magic Brush & Edge Touch-Up</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400">Precision de-fringe, halo remover & pixel restore</p>
          </div>
        </div>

        {/* Undo/Redo & Stroke Info */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canUndo || disabled}
            onClick={onUndoStroke}
            title="Undo Last Stroke"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] dark:text-zinc-200 dark:hover:bg-[#202c33] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!canRedo || disabled}
            onClick={onRedoStroke}
            title="Redo Stroke"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] dark:text-zinc-200 dark:hover:bg-[#202c33] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {strokeCount > 0 && (
            <button
              type="button"
              onClick={onClearStrokes}
              title="Clear all manual touch-up strokes"
              className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/30 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset ({strokeCount})
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs: Brush Tools, 1-Click Refinements, Inspection & Zoom */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 dark:bg-[#182229] p-1 border border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("brush")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "brush"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#202c33] dark:text-white"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Paintbrush className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Magic Brushes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("one-click")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "one-click"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#202c33] dark:text-white"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span>1-Click Edge FX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspection")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "inspection"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#202c33] dark:text-white"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Eye className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Zoom & Loupe</span>
        </button>
      </div>

      {/* Tab 1: Magic Brush Tools & Adjustments */}
      {activeTab === "brush" && (
        <div className="mt-3 flex flex-col gap-3">
          {/* Tool Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BRUSH_TOOLS.map((tool) => {
              const isSelected = activeTool === tool.id;
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectTool(isSelected ? "SELECT" : tool.id)}
                  className={`group relative flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/80 text-amber-950 dark:border-amber-400 dark:bg-amber-500/20 dark:text-amber-100 shadow-sm ring-1 ring-amber-500/40 font-bold"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:bg-[#202c33]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{tool.shortLabel}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="mt-1 text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1">{tool.desc}</span>
                </button>
              );
            })}

            {/* Select Tool Quick Switch */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectTool("SELECT")}
              className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                activeTool === "SELECT"
                  ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-white shadow-sm ring-1 ring-emerald-500/40 font-bold"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:bg-[#202c33]"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MousePointer className="h-3.5 w-3.5 text-emerald-600 dark:text-[#25D366]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Select / Move</span>
                </div>
                {activeTool === "SELECT" && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-[#25D366]" />}
              </div>
              <span className="mt-1 text-[11px] text-slate-600 dark:text-zinc-400">Exit brush & transform items</span>
            </button>
          </div>

          {/* Active Brush Sliders (Size, Hardness, Opacity, Tolerance) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-[#182229] p-4">
            {/* Brush Size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-amber-500" /> Brush Diameter
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{brushSize}px</span>
              </div>
              <input
                type="range"
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                <span>{MIN_BRUSH_SIZE}px (Fine)</span>
                <span>{MAX_BRUSH_SIZE}px (Broad)</span>
              </div>
            </div>

            {/* Brush Hardness */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Feather className="h-3.5 w-3.5 text-purple-500" /> Edge Hardness (Feather)
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{brushHardness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={brushHardness}
                onChange={(e) => onBrushHardnessChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                <span>0% (Soft Airbrush)</span>
                <span>100% (Crisp Hard)</span>
              </div>
            </div>

            {/* Brush Opacity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">Stroke Opacity</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {Math.round(brushOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={brushOpacity}
                onChange={(e) => onBrushOpacityChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
              />
            </div>

            {/* Magic Tolerance (for Magic Edge & Color Wand) */}
            {(activeTool === "MAGIC_EDGE" || activeTool === "COLOR_WAND") && (
              <div className="flex flex-col gap-1.5 border-t border-slate-200 dark:border-white/10 pt-2.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-500" /> Halo Detection Tolerance
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={tolerance}
                  onChange={(e) => onToleranceChange(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: 1-Click Automatic Edge Refinements */}
      {activeTab === "one-click" && (
        <div className="mt-3 flex flex-col gap-2.5">
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            Instant algorithmic filters to clean edges, remove green/white fringe, and smooth cutout silhouettes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Auto De-Fringe / Clean Halos */}
            <button
              type="button"
              disabled={!activeImageUrl || !!isProcessingOp || disabled}
              onClick={() =>
                handleRun1ClickOp(
                  "defringe",
                  (img) => autoDeFringeCutout(img, tolerance),
                  "Cleaned edge halos & de-fringed cutout"
                )
              }
              className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/15 p-3.5 text-left transition hover:bg-amber-100 dark:hover:bg-amber-500/25 disabled:opacity-40 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {isProcessingOp === "defringe" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-300" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto De-Fringe</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">Removes background halo fringe</p>
                </div>
              </div>
            </button>

            {/* 2. Auto Smooth Edges */}
            <button
              type="button"
              disabled={!activeImageUrl || !!isProcessingOp || disabled}
              onClick={() =>
                handleRun1ClickOp(
                  "smooth",
                  (img) => autoSmoothCutoutEdges(img),
                  "Applied anti-aliased edge smoothing"
                )
              }
              className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-50/80 dark:border-purple-500/30 dark:bg-purple-500/15 p-3.5 text-left transition hover:bg-purple-100 dark:hover:bg-purple-500/25 disabled:opacity-40 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300">
                  {isProcessingOp === "smooth" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-300" />
                  ) : (
                    <Feather className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto Smooth</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">Anti-aliases jagged pixel steps</p>
                </div>
              </div>
            </button>

            {/* 3. Choke Edge (Trim 1px) */}
            <button
              type="button"
              disabled={!activeImageUrl || !!isProcessingOp || disabled}
              onClick={() =>
                handleRun1ClickOp(
                  "choke",
                  (img) => chokeCutoutEdge(img, 1),
                  "Trimmed cutout edge by 1px"
                )
              }
              className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/15 p-3.5 text-left transition hover:bg-rose-100 dark:hover:bg-rose-500/25 disabled:opacity-40 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {isProcessingOp === "choke" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-600 dark:text-rose-300" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Choke Edge (-1px)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">Inward trim to shave stray pixels</p>
                </div>
              </div>
            </button>

            {/* 4. Expand Edge (+1px) */}
            <button
              type="button"
              disabled={!activeImageUrl || !!isProcessingOp || disabled}
              onClick={() =>
                handleRun1ClickOp(
                  "expand",
                  (img) => expandCutoutEdge(img, 1),
                  "Expanded cutout edge by 1px"
                )
              }
              className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/15 p-3.5 text-left transition hover:bg-emerald-100 dark:hover:bg-emerald-500/25 disabled:opacity-40 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {isProcessingOp === "expand" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-300" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Expand Edge (+1px)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">Recovers clipped subject border</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Inspection, Zoom & Ghost Reference Overlay */}
      {activeTab === "inspection" && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-[#182229] p-4">
          {/* Zoom Level */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ZoomIn className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Canvas Inspection Zoom
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 1.5, 2, 3].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => onZoomChange(z)}
                  className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                    zoomLevel === z
                      ? "border-emerald-500 bg-white text-emerald-950 dark:bg-[#202c33] dark:text-white font-extrabold shadow-sm ring-1 ring-emerald-500/40"
                      : "border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] dark:text-zinc-200 dark:hover:bg-[#202c33]"
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>

          {/* Ghost Overlay of Original Photo */}
          <div className="flex flex-col gap-1.5 border-t border-slate-200 dark:border-white/10 pt-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-amber-500" /> Ghost Photo Reference Guide
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {Math.round(ghostOverlayOpacity * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Reveals original un-cutout photo underneath so you can see exact edges while painting.
            </p>
            <input
              type="range"
              min={0}
              max={1.0}
              step={0.05}
              value={ghostOverlayOpacity}
              onChange={(e) => onGhostOverlayChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RefinementStudioCard;
