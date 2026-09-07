"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Download,
  Sparkles,
  Zap,
  UploadCloud,
  FileCheck,
} from "lucide-react";
import { StickerRecord } from "../../src/types/pack";
import { StickerDraft } from "../../utils/draftsDb";
import { ConfirmModal } from "../UI/ConfirmModal";
import { handleStickerImageError } from "../../utils/imageHelper";

export type SlotStatus = "EMPTY" | "DRAFT" | "OCCUPIED";

interface SlotCardProps {
  slotIndex: number;
  sticker?: StickerRecord | null;
  draft?: StickerDraft | null;
  onOpenEditor: (slotIndex: number, draftToResume?: StickerDraft | null, existingStickerUrl?: string | null) => void;
  onClearSlot: (slotIndex: number) => void;
  onDiscardDraft?: (slotIndex: number) => void;
  onQuickUpload?: (slotIndex: number, file: File) => void;
}

export function SlotCard({
  slotIndex,
  sticker,
  draft,
  onOpenEditor,
  onClearSlot,
  onDiscardDraft,
  onQuickUpload,
}: SlotCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status: SlotStatus = sticker ? "OCCUPIED" : draft ? "DRAFT" : "EMPTY";
  const slotNumber = slotIndex + 1;

  // Drag and drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onQuickUpload) {
      onQuickUpload(slotIndex, file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onQuickUpload) {
      onQuickUpload(slotIndex, file);
    }
  };

  const handleDownloadSticker = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = sticker?.imageUrl || draft?.activeImageUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `slot_${slotNumber}_sticker.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative aspect-square w-full overflow-hidden rounded-3xl border transition-all duration-300 select-none ${
        isDragOver
          ? "border-2 border-dashed border-[#25D366] bg-[#25D366]/15 scale-[1.03] shadow-xl shadow-emerald-500/20"
          : status === "OCCUPIED"
          ? "border-slate-200/90 dark:border-white/15 bg-[#0c1317]/5 dark:bg-[#0c1317] shadow-sm hover:shadow-xl hover:border-[#25D366]/60 dark:hover:border-[#25D366]/50"
          : status === "DRAFT"
          ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm hover:border-amber-500 hover:shadow-md"
          : "border-dashed border-slate-300 dark:border-white/15 bg-slate-50/80 dark:bg-[#111b21]/50 hover:border-[#25D366] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 hover:shadow-md"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* Background WhatsApp Transparent Pattern for filled slots */}
      {(status === "OCCUPIED" || status === "DRAFT") && (
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #64748b30 1.2px, transparent 1.2px)`,
            backgroundSize: "14px 14px",
          }}
        />
      )}

      {/* Floating Top Left Slot Number Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
        <span
          className={`flex h-6 min-w-6 px-1.5 items-center justify-center rounded-lg text-[10px] font-black tracking-tight shadow-xs backdrop-blur-md transition-all ${
            status === "OCCUPIED"
              ? "bg-black/50 text-white/90 border border-white/15"
              : status === "DRAFT"
              ? "bg-amber-500/90 text-white border border-amber-400/40"
              : "bg-slate-200/90 dark:bg-white/10 text-slate-600 dark:text-slate-300"
          }`}
        >
          #{slotNumber}
        </span>
      </div>

      {/* Floating Top Right Badges (Draft / Animated GIF) */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 pointer-events-none">
        {status === "DRAFT" && (
          <span className="flex items-center gap-1 rounded-lg bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs">
            <Sparkles className="h-2.5 w-2.5" />
            Draft
          </span>
        )}
        {status === "OCCUPIED" && sticker?.isAnimated && (
          <span className="flex items-center gap-0.5 rounded-lg bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-extrabold text-white border border-white/15 shadow-xs">
            <Zap className="h-2.5 w-2.5 text-yellow-400" />
            GIF
          </span>
        )}
      </div>

      {/* Main Full-Bleed 1:1 Sticker Area (Edge-to-Edge like Sticker.ly) */}
      <div
        onClick={() => {
          if (status === "OCCUPIED") {
            onOpenEditor(slotIndex, draft || null, sticker?.imageUrl);
          } else if (status === "DRAFT") {
            onOpenEditor(slotIndex, draft, draft?.activeImageUrl);
          } else {
            onOpenEditor(slotIndex);
          }
        }}
        className="absolute inset-0 h-full w-full flex items-center justify-center p-0 cursor-pointer z-10"
      >
        {status === "OCCUPIED" && sticker ? (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            <img
              src={sticker.imageUrl}
              alt={`Slot #${slotNumber}`}
              className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => handleStickerImageError(e, sticker.imageUrl)}
            />
          </div>
        ) : status === "DRAFT" && draft ? (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            {draft.thumbnail || draft.activeImageUrl ? (
              <img
                src={draft.thumbnail || draft.activeImageUrl!}
                alt={`Draft Slot #${slotNumber}`}
                className="h-full w-full object-contain opacity-95 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => handleStickerImageError(e, draft.thumbnail || draft.activeImageUrl)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20">
                  <FileCheck className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold">Resume Draft</span>
              </div>
            )}
          </div>
        ) : (
          /* EMPTY SLOT 1:1 STATE */
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-white/60 dark:bg-white/5 text-slate-400 group-hover:border-[#25D366] group-hover:bg-[#25D366]/10 group-hover:text-[#25D366] transition-all">
              <Plus className="h-5 w-5 stroke-[2.4]" />
            </div>
            <span className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
              Add Sticker
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">
              Click or drop
            </span>
          </div>
        )}
      </div>

      {/* Floating Action Controls Overlay */}
      <div className="absolute bottom-2 inset-x-2 z-20 pointer-events-auto">
        {status === "OCCUPIED" ? (
          <div className="flex w-full items-center justify-between gap-1 rounded-2xl bg-slate-900/80 dark:bg-black/80 backdrop-blur-md p-1 border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditor(slotIndex, draft || null, sticker?.imageUrl);
              }}
              className="flex h-7 flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 text-[11px] font-bold text-white hover:bg-[#25D366] transition-all cursor-pointer"
              title="Edit sticker in Studio"
            >
              <Edit3 className="h-3 w-3" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSticker}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-white/90 hover:bg-white/25 transition-all cursor-pointer"
              title="Download WebP"
            >
              <Download className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowClearConfirm(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              title="Clear slot"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : status === "DRAFT" ? (
          <div className="flex w-full items-center justify-between gap-1 rounded-2xl bg-slate-900/80 dark:bg-black/80 backdrop-blur-md p-1 border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditor(slotIndex, draft, draft?.activeImageUrl);
              }}
              className="flex h-7 flex-1 items-center justify-center gap-1 rounded-xl bg-amber-500 text-[11px] font-bold text-white hover:bg-amber-600 transition-all cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Resume</span>
            </button>

            {onDiscardDraft && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDiscardConfirm(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                title="Discard draft"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex w-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1 rounded-lg bg-black/40 dark:bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-emerald-500/20"
            >
              <UploadCloud className="h-3 w-3" />
              <span>Quick Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing Slot */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearSlot(slotIndex);
        }}
        title={`Clear Slot #${slotNumber}?`}
        description={
          <span>
            This will permanently remove the sticker artwork and data from <strong>Slot #{slotNumber}</strong>. You can re-upload or edit a new sticker in this slot at any time.
          </span>
        }
        confirmLabel="Clear Slot"
        variant="danger"
      />

      {/* Confirmation Modal for Discarding Draft */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          if (onDiscardDraft) onDiscardDraft(slotIndex);
        }}
        title={`Discard Draft for Slot #${slotNumber}?`}
        description={
          <span>
            Are you sure you want to discard your unsaved work for <strong>Slot #{slotNumber}</strong>? This draft will be removed from local storage.
          </span>
        }
        confirmLabel="Discard Draft"
        variant="warning"
      />
    </div>
  );
}
