"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Trash2,
  Image as ImageIcon,
  Type,
  Zap,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import {
  CanvasLayerItem,
  MAIN_IMAGE_LAYER_ID,
  COMIC_BG_LAYER_ID,
} from "../../utils/layerManagement";

export interface LayerManagerCardProps {
  layers: CanvasLayerItem[];
  selectedId: string | null;
  onSelectLayer: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  onBringToFront: (layerId: string) => void;
  onSendToBack: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onToggleFlipX: (layerId: string) => void;
  onToggleFlipY: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
}

export function LayerManagerCard({
  layers,
  selectedId,
  onSelectLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onBringToFront,
  onSendToBack,
  onToggleVisibility,
  onToggleLock,
  onToggleFlipX,
  onToggleFlipY,
  onDuplicateLayer,
  onDeleteLayer,
}: LayerManagerCardProps) {
  // Display layers in stack order (top-most layer first)
  const displayLayers = [...layers].reverse();

  const getLayerIcon = (type: CanvasLayerItem["type"]) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-3.5 w-3.5 text-orange-400" />;
      case "text":
        return <Type className="h-3.5 w-3.5 text-pink-400" />;
      case "comic-bg":
        return <Zap className="h-3.5 w-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111b21] backdrop-blur-xl">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Visual Layers & Hierarchy</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400">Z-Index stack, lock, mirror & visibility</p>
          </div>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#182229] px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
          {layers.length} {layers.length === 1 ? "Layer" : "Layers"}
        </span>
      </div>

      {/* Layer List Container */}
      <div className="mt-4 flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {displayLayers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600 dark:border-white/10 dark:bg-[#182229] dark:text-zinc-400">
            No active layers on canvas.
          </div>
        ) : (
          displayLayers.map((layer, index) => {
            const isSelected = selectedId === layer.id;
            const isTop = index === 0;
            const isBottom = index === displayLayers.length - 1;
            const isText = layer.type === "text";
            const isImage = layer.type === "image";

            return (
              <motion.div
                key={layer.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group flex items-center justify-between rounded-2xl border p-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-white ring-1 ring-emerald-500/40"
                    : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] dark:text-zinc-200 dark:hover:bg-[#202c33]"
                } ${layer.visible === false ? "opacity-50" : "opacity-100"}`}
              >
                {/* Layer Title & Selection */}
                <button
                  type="button"
                  onClick={() => onSelectLayer(layer.id)}
                  className="flex flex-1 items-center gap-2 text-left min-w-0 pr-2 cursor-pointer"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-[#202c33] border border-slate-200 dark:border-white/10 shadow-xs">
                    {getLayerIcon(layer.type)}
                  </div>

                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {layer.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-500 dark:text-zinc-400">
                      {layer.type} • Layer #{displayLayers.length - index}
                    </span>
                  </div>
                </button>

                {/* Layer Control Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(layer.id)}
                    title={layer.visible === false ? "Show layer" : "Hide layer"}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                      layer.visible === false
                        ? "border-amber-500/40 bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                        : "border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942]"
                    }`}
                  >
                    {layer.visible === false ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleLock(layer.id)}
                    title={layer.locked ? "Unlock layer" : "Lock layer"}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                      layer.locked
                        ? "border-rose-500/40 bg-rose-50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                        : "border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942]"
                    }`}
                  >
                    {layer.locked ? (
                      <Lock className="h-3.5 w-3.5 text-rose-600" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Flip Horizontal */}
                  {(isImage || isText) && (
                    <button
                      type="button"
                      onClick={() => onToggleFlipX(layer.id)}
                      title="Flip Horizontal (Mirror)"
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                        layer.flipX
                          ? "border-cyan-500/40 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold"
                          : "border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942]"
                      }`}
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Reorder: Move Up (Higher Z) */}
                  <button
                    type="button"
                    disabled={isTop}
                    onClick={() => onMoveLayerUp(layer.id)}
                    title="Bring Forward (Up)"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Reorder: Move Down (Lower Z) */}
                  <button
                    type="button"
                    disabled={isBottom}
                    onClick={() => onMoveLayerDown(layer.id)}
                    title="Send Backward (Down)"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Duplicate (Text layers) */}
                  {isText && (
                    <button
                      type="button"
                      onClick={() => onDuplicateLayer(layer.id)}
                      title="Duplicate Layer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] transition cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-pink-500" />
                    </button>
                  )}

                  {/* Delete layer */}
                  {(isText || isImage) && (
                    <button
                      type="button"
                      onClick={() => onDeleteLayer(layer.id)}
                      title="Delete Layer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default LayerManagerCard;
