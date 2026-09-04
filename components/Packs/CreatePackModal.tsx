"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Sticker,
  User,
  Loader2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPack } from "../../utils/packApi";
import { StickerPackRecord } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";

interface CreatePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackCreated: (newPack: StickerPackRecord) => void;
  defaultCreatorName?: string;
}

export function CreatePackModal({
  isOpen,
  onClose,
  onPackCreated,
  defaultCreatorName = "Sticker Creator",
}: CreatePackModalProps) {
  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState(defaultCreatorName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    const cleanPublisher = publisher.trim();

    if (!cleanTitle) {
      setErrorMessage("Please enter a pack name.");
      return;
    }

    if (!cleanPublisher) {
      setErrorMessage("Please specify the creator or author name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createPack({
        title: cleanTitle,
        publisher: cleanPublisher,
      });

      onPackCreated(created);
      onClose();
    } catch (err: any) {
      console.error("Failed to create pack:", err);
      setErrorMessage(err.message || "Failed to create sticker pack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="New Sticker Pack"
      description="Creates a dedicated 30-slot set for WhatsApp & Telegram"
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-[#128C7E] to-[#075E54] text-white shadow-md shadow-emerald-500/20">
          <Sticker className="h-5 w-5 stroke-[2.2]" />
        </div>
      }
      maxWidthClass="max-w-lg"
    >
      {/* Error Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pack Name Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Pack Name <span className="text-[#25D366]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chubby Cat Reactions, Cyberpunk Memes"
              maxLength={45}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all"
            />
            <span className="absolute right-3.5 top-3.5 text-[10px] font-semibold text-slate-400">
              {title.length}/45
            </span>
          </div>
        </div>

        {/* Creator / Publisher Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Creator Name <span className="text-[#25D366]">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g., @alex, Studio Pixel"
              maxLength={30}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] pl-10 pr-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Displayed in WhatsApp sticker selector under pack details.
          </p>
        </div>

        {/* Info Badge */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
          <Info className="h-4 w-4 shrink-0 text-[#25D366] mt-0.5" />
          <span>
            Your pack includes 30 interactive sticker slots. The first sticker in Slot #1 is automatically used as the pack icon in WhatsApp!
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Pack...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Create 30-Slot Pack</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
