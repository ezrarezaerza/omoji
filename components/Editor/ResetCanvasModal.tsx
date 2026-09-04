"use client";

import React from "react";
import {
  RotateCcw,
  Eraser,
  Type,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Undo2,
  Trash2,
  ImagePlus,
  Flame,
} from "lucide-react";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";

export type ResetActionType =
  | "REVERT_ORIGINAL_IMAGE"
  | "CLEAR_STROKES_ONLY"
  | "CLEAR_TEXT_ONLY"
  | "FULL_CLEAN_SLATE"
  | "CLEAR_ALL_AND_NEW_UPLOAD";

export interface ResetCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (action: ResetActionType) => void;
  hasOriginalImage: boolean;
  strokeCount: number;
  textCount: number;
  hasEffects: boolean;
}

export function ResetCanvasModal({
  isOpen,
  onClose,
  onConfirmReset,
  hasOriginalImage,
  strokeCount,
  textCount,
  hasEffects,
}: ResetCanvasModalProps) {
  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Canvas Options"
      description="Select what you would like to reset or clear"
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400">
          <RotateCcw className="h-5 w-5" />
        </div>
      }
      maxWidthClass="max-w-lg"
    >
      <div className="flex flex-col gap-3 font-sans">
        {/* Reset Options List */}
        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Option 1: Revert to Original Photo */}
          {hasOriginalImage && (
            <button
              type="button"
              onClick={() => {
                onConfirmReset("REVERT_ORIGINAL_IMAGE");
                onClose();
              }}
              className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-left transition hover:border-amber-500/50 hover:bg-amber-50/50 dark:border-white/5 dark:bg-[#182229] dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10 cursor-pointer"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Revert Cutout to Original Photo
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Preserves Text
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
                  Restores the uncut original photo and clears eraser touch-ups, keeping your text & meme captions.
                </p>
              </div>
            </button>
          )}

          {/* Option 2: Clear Manual Strokes Only */}
          {strokeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onConfirmReset("CLEAR_STROKES_ONLY");
                onClose();
              }}
              className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-left transition hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:border-white/5 dark:bg-[#182229] dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 cursor-pointer"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                <Eraser className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Clear Manual Strokes ({strokeCount})
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                    Strokes only
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
                  Clears all hand-drawn eraser and restore brush lines while preserving cutout and text.
                </p>
              </div>
            </button>
          )}

          {/* Option 3: Clear Text & Meme Elements */}
          {textCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onConfirmReset("CLEAR_TEXT_ONLY");
                onClose();
              }}
              className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-left transition hover:border-purple-500/50 hover:bg-purple-50/50 dark:border-white/5 dark:bg-[#182229] dark:hover:border-purple-500/30 dark:hover:bg-purple-500/10 cursor-pointer"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <Type className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Clear All Text & Captions ({textCount})
                  </span>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    Text only
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
                  Removes all custom text labels, speech bubbles, and meme captions.
                </p>
              </div>
            </button>
          )}

          {/* Option 4: Full Clean Slate Reset */}
          <button
            type="button"
            onClick={() => {
              onConfirmReset("FULL_CLEAN_SLATE");
              onClose();
            }}
            className="group flex items-start gap-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3.5 text-left transition hover:border-rose-500/50 hover:bg-rose-100/60 dark:border-rose-500/20 dark:bg-rose-950/20 dark:hover:border-rose-500/40 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <Flame className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Full Clean Slate
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  Reset All Effects
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-rose-700/80 dark:text-rose-300/80">
                Resets background, removes all text, strokes, die-cut outlines, and visual filters back to initial photo.
              </p>
            </div>
          </button>

          {/* Option 5: Start Fresh with New Upload */}
          <button
            type="button"
            onClick={() => {
              onConfirmReset("CLEAR_ALL_AND_NEW_UPLOAD");
              onClose();
            }}
            className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-left transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/5 dark:bg-[#182229] dark:hover:bg-white/5 cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300 group-hover:scale-105 transition-transform">
              <ImagePlus className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Start Fresh with New Upload
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
                Empties the current canvas to select or drop a new photo or video file.
              </p>
            </div>
          </button>
        </div>

        {/* Safety Guarantee Footer Banner */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-3">
          <Undo2 className="h-4 w-4 shrink-0 text-[#25D366]" />
          <p className="text-[11px] font-medium text-emerald-950 dark:text-emerald-200">
            <strong className="font-bold">Safe Reset:</strong> Any reset is saved to history and can be reversed immediately with{" "}
            <kbd className="rounded-md border border-emerald-500/40 bg-white dark:bg-black/40 px-1 py-0.5 text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
              Ctrl+Z
            </kbd>
            .
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
