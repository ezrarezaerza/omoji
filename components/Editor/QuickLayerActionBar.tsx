"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { CanvasLayerItem } from "../../utils/layerManagement";

export interface QuickLayerActionBarProps {
  selectedId: string | null;
  selectedLayer?: CanvasLayerItem;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onToggleFlipX: (id: string) => void;
  onToggleFlipY: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onCenterAlign?: (id: string) => void;
}

export function QuickLayerActionBar({
  selectedId,
  selectedLayer,
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
  onCenterAlign,
}: QuickLayerActionBarProps) {
  if (!selectedId || !selectedLayer) return null;

  const isText = selectedLayer.type === "text";
  const isLocked = selectedLayer.locked;
  const isHidden = selectedLayer.visible === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="mt-3 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#182229]"
    >
      <div className="px-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="max-w-[120px] truncate">{selectedLayer.name}</span>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-white/15 mx-0.5" />

      {/* Quick Center Alignment (if text) */}
      {isText && onCenterAlign && (
        <button
          type="button"
          onClick={() => onCenterAlign(selectedId)}
          title="Center text horizontally on canvas"
          className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30 transition cursor-pointer"
        >
          <span>🎯</span>
          <span className="hidden sm:inline">Center</span>
        </button>
      )}

      {/* Flip Horizontal */}
      <button
        type="button"
        onClick={() => onToggleFlipX(selectedId)}
        title="Mirror / Flip Horizontal"
        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
          selectedLayer.flipX
            ? "bg-cyan-500/20 text-cyan-900 border border-cyan-400/50 dark:text-cyan-200"
            : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] dark:hover:text-white"
        }`}
      >
        <FlipHorizontal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Flip H</span>
      </button>

      {/* Flip Vertical */}
      <button
        type="button"
        onClick={() => onToggleFlipY(selectedId)}
        title="Flip Vertical"
        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
          selectedLayer.flipY
            ? "bg-cyan-500/20 text-cyan-900 border border-cyan-400/50 dark:text-cyan-200"
            : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] dark:hover:text-white"
        }`}
      >
        <FlipVertical className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Flip V</span>
      </button>

      {/* Bring to Front */}
      <button
        type="button"
        onClick={() => onBringToFront(selectedId)}
        title="Bring to Very Front"
        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] dark:hover:text-white transition cursor-pointer"
      >
        <ChevronsUp className="h-3.5 w-3.5" />
        <span className="hidden md:inline">To Front</span>
      </button>

      {/* Send to Back */}
      <button
        type="button"
        onClick={() => onSendToBack(selectedId)}
        title="Send to Very Back"
        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] dark:hover:text-white transition cursor-pointer"
      >
        <ChevronsDown className="h-3.5 w-3.5" />
        <span className="hidden md:inline">To Back</span>
      </button>

      {/* Lock / Unlock */}
      <button
        type="button"
        onClick={() => onToggleLock(selectedId)}
        title={isLocked ? "Unlock Element" : "Lock Element"}
        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
          isLocked
            ? "bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-500/30 dark:text-rose-200 dark:border-rose-400/50"
            : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] dark:hover:text-white"
        }`}
      >
        {isLocked ? <Lock className="h-3.5 w-3.5 text-rose-600" /> : <Unlock className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{isLocked ? "Locked" : "Lock"}</span>
      </button>

      {/* Duplicate (if text) */}
      {isText && (
        <button
          type="button"
          onClick={() => onDuplicateLayer(selectedId)}
          title="Duplicate Element"
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942] dark:hover:text-white transition cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5 text-pink-500" />
          <span className="hidden sm:inline">Copy</span>
        </button>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDeleteLayer(selectedId)}
        title="Delete Element"
        className="flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30 transition cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Delete</span>
      </button>
    </motion.div>
  );
}

export default QuickLayerActionBar;
