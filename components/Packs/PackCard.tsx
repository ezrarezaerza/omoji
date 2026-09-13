"use client";

import React, { useState } from "react";
import {
  Sticker,
  User,
  ArrowRight,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Layers,
  Sparkles,
  ExternalLink,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { StickerPackRecord } from "../../src/types/pack";
import { ConfirmModal } from "../UI/ConfirmModal";
import { handleStickerImageError } from "../../utils/imageHelper";

interface PackCardProps {
  pack: StickerPackRecord;
  onSelectPack: (pack: StickerPackRecord) => void;
  onDeletePack?: (packId: string) => void;
  onExportPack?: (pack: StickerPackRecord) => void;
}

export function PackCard({
  pack,
  onSelectPack,
  onDeletePack,
  onExportPack,
}: PackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const totalStickers = pack.stickers?.length || 0;
  const isReadyForWhatsApp = totalStickers >= 3;
  const percentage = Math.min(100, Math.round((totalStickers / 30) * 100));

  // Get up to 4 sticker previews for the mini collage
  const previewStickers = (pack.stickers || []).slice(0, 4);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeletePack) return;
    setShowConfirmDelete(true);
  };

  const executeDelete = async () => {
    if (!onDeletePack) return;
    try {
      setIsDeleting(true);
      await onDeletePack(pack.id);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExportPack) {
      onExportPack(pack);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelectPack(pack)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer"
    >
      {/* Top Details & Action Dropdown */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Tray Icon */}
            <div className="relative h-12 w-12 shrink-0 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] p-1 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src={pack.trayIconUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Pack"}
                alt={pack.title}
                className="h-full w-full object-contain rounded-xl"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => handleStickerImageError(e, pack.trayIconUrl)}
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-[#25D366] transition-colors line-clamp-1 font-['Space_Grotesk']">
                {pack.title}
              </h3>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <User className="h-3 w-3 text-slate-400" />
                <span>@{pack.publisher}</span>
              </p>
            </div>
          </div>

          {/* Context Actions */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {onDeletePack && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete Pack"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4-Sticker Preview Collage Grid */}
        <div className="mb-4 grid grid-cols-4 gap-2 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#182229]/60 p-2.5">
          {[0, 1, 2, 3].map((slotIdx) => {
            const sticker = previewStickers[slotIdx];
            return (
              <div
                key={slotIdx}
                className="aspect-square relative flex items-center justify-center rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#111b21] p-1 overflow-hidden shadow-2xs"
              >
                {sticker ? (
                  <img
                    src={sticker.imageUrl}
                    alt={`Sticker ${slotIdx + 1}`}
                    className="h-full w-full object-contain"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleStickerImageError(e, sticker.imageUrl)}
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                    +{slotIdx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Progress & WhatsApp Status */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
        {/* Progress Bar & Badges */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#25D366]" />
              {totalStickers}/30 Slots Filled
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isReadyForWhatsApp
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              {isReadyForWhatsApp ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-[#25D366]" />
                  Ready
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  Min. 3
                </>
              )}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isReadyForWhatsApp
                  ? "bg-gradient-to-r from-[#25D366] to-[#128C7E]"
                  : "bg-amber-400"
              }`}
              style={{ width: `${Math.max(6, percentage)}%` }}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] font-medium text-slate-400">
            Click to open pack
          </span>

          <div className="flex items-center gap-1.5">
            {isReadyForWhatsApp && onExportPack && (
              <button
                type="button"
                onClick={handleExport}
                title="Export WhatsApp pack"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-xs font-bold shadow-sm group-hover:bg-[#25D366] group-hover:text-white dark:group-hover:bg-[#25D366] dark:group-hover:text-white transition-all cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Pack Deletion Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={executeDelete}
        title={`Delete "${pack.title}"?`}
        description={
          <span>
            This will permanently remove <strong>"{pack.title}"</strong> and all {totalStickers} stickers inside it from your workspace. This action cannot be undone.
          </span>
        }
        confirmLabel="Delete Pack"
        variant="danger"
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
