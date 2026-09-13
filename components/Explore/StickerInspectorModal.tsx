"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Paintbrush,
  Layers,
  Heart,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
  ArrowRight,
} from "lucide-react";
import { ExploreSticker, ExplorePack } from "../../src/types/explore";
import { StickerPackRecord } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import { WhatsAppChatSimulator } from "./WhatsAppChatSimulator";
import { AddToSlotDrawer } from "./AddToSlotDrawer";
import { ReactionBurst, useReactionBurst } from "./ReactionBurst";

interface StickerInspectorModalProps {
  sticker: ExploreSticker | null;
  pack: ExplorePack | null;
  isOpen: boolean;
  onClose: () => void;
  onRemixInStudio: (stickerUrl: string, stickerTitle?: string) => void;
  onDownloadFullPack: (pack: ExplorePack) => Promise<void>;
  onOpenStudioPack: (studioPack: StickerPackRecord, slotIndex?: number) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onShowNotice?: (message: string) => void;
}

export function StickerInspectorModal({
  sticker,
  pack,
  isOpen,
  onClose,
  onRemixInStudio,
  onDownloadFullPack,
  onOpenStudioPack,
  onOpenCreatorProfile,
  onShowNotice,
}: StickerInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<"simulator" | "addToSlot">("simulator");
  const [isExportingPack, setIsExportingPack] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { particles, triggerBurst, removeParticle } = useReactionBurst();

  useEffect(() => {
    if (!sticker) return;
    let isMounted = true;
    import("../../utils/exploreDb").then(({ isStickerFavorited }) => {
      isStickerFavorited(sticker.id).then((saved) => {
        if (isMounted) setIsSaved(saved);
      });
    });
    return () => {
      isMounted = false;
    };
  }, [sticker]);

  if (!sticker || !pack) return null;

  const handleToggleFavoriteSticker = async () => {
    try {
      const { toggleFavoriteSticker } = await import("../../utils/exploreDb");
      const nextSaved = await toggleFavoriteSticker(sticker.id, pack.id, sticker, pack.title);
      setIsSaved(nextSaved);
      if (nextSaved) {
        triggerBurst("❤️", 8);
        onShowNotice?.(`Saved "${sticker.title || "Sticker"}" to your Favorites!`);
      } else {
        onShowNotice?.(`Removed from your Saved Stickers.`);
      }
    } catch (e) {
      console.warn("Could not toggle sticker favorite:", e);
    }
  };

  const handleCopySticker = async () => {
    try {
      await navigator.clipboard.writeText(sticker.imageUrl);
      setCopiedLink(true);
      triggerBurst("✨", 5);
      onShowNotice?.("Sticker image URL copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowNotice?.("Could not copy to clipboard.");
    }
  };

  const handleRemix = () => {
    triggerBurst("🎨", 6);
    onRemixInStudio(sticker.imageUrl, sticker.title);
    onClose();
  };

  const handleExportFullPack = async () => {
    setIsExportingPack(true);
    try {
      await onDownloadFullPack(pack);
    } finally {
      setIsExportingPack(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 font-['Space_Grotesk']">
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
            {sticker.title || "Sticker Inspector"}
          </span>
          <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {pack.category}
          </span>
        </div>
      }
      description={
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>From pack:</span>
          <strong className="text-slate-800 dark:text-slate-200">{pack.title}</strong>
          <span>by</span>
          <button
            type="button"
            onClick={() => {
              if (onOpenCreatorProfile && pack.creator.username) {
                onClose();
                onOpenCreatorProfile(pack.creator.username);
              }
            }}
            title={`View ${pack.creator.name}'s profile`}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#25D366] transition-colors cursor-pointer inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <span>{pack.creator.name}</span>
            {pack.creator.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/20 inline" />
            )}
          </button>
        </div>
      }
      maxWidthClass="max-w-2xl"
    >
      <div className="relative space-y-4">
        {/* Floating reaction burst canvas */}
        <ReactionBurst particles={particles} onComplete={removeParticle} />

        {/* Top View Selector Tabs: Live Chat Simulator vs 1-Tap Add to Slot */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#111b21] p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold font-['Space_Grotesk']">
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
              <span>WhatsApp Live Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addToSlot")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === "addToSlot"
                  ? "bg-[#25D366] text-black shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>1-Tap Add to Slot</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleFavoriteSticker}
              title={isSaved ? "Remove from Saved Stickers" : "Save to Favorites"}
              className={`flex h-8 px-2.5 items-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSaved
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-xs"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-transform ${
                  isSaved ? "fill-rose-500 scale-110" : ""
                }`}
              />
              <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySticker}
              title="Copy Sticker URL"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#182229] transition-all cursor-pointer"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-[#25D366]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === "simulator" ? (
          <WhatsAppChatSimulator sticker={sticker} pack={pack} />
        ) : (
          <AddToSlotDrawer
            sticker={sticker}
            pack={pack}
            onSuccess={(updatedPack, slotIdx) => {
              triggerBurst("🎉", 8);
              onShowNotice?.(
                `✨ Placed into Slot #${slotIdx + 1} of "${updatedPack.title}"!`
              );
            }}
            onOpenStudioPack={(studioPack, slotIdx) => {
              onOpenStudioPack(studioPack, slotIdx);
              onClose();
            }}
            onRemixInStudio={(studioPack, slotIdx, url, title) => {
              onOpenStudioPack(studioPack, slotIdx);
              onRemixInStudio(url, title);
              onClose();
            }}
            onClose={onClose}
          />
        )}

        {/* Technical Specs & Metadata Bento Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl bg-slate-50 dark:bg-[#111b21] p-3 border border-slate-200/80 dark:border-white/10 text-xs">
          <div className="space-y-0.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Dimensions
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">512 × 512 px</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Format
            </div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>WebP (WhatsApp)</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Assigned Emojis
            </div>
            <div className="font-bold text-base leading-none">
              {sticker.emojis?.join(" ") || "✨"}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Community Stats
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {(pack.downloadCount || 0).toLocaleString()} DLs
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
          {/* Action 1: Remix in Studio */}
          <button
            type="button"
            onClick={handleRemix}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-xs font-black shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-transform active:scale-95 cursor-pointer font-['Space_Grotesk']"
          >
            <Paintbrush className="h-4 w-4 text-[#25D366]" />
            <span>Remix in Studio Canvas</span>
          </button>

          {/* Action 2: Add to Slot Tab Toggle */}
          {activeTab !== "addToSlot" && (
            <button
              type="button"
              onClick={() => setActiveTab("addToSlot")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:border-[#25D366] hover:bg-slate-50 dark:hover:bg-[#202c33] transition-transform active:scale-95 cursor-pointer font-['Space_Grotesk']"
            >
              <Layers className="h-3.5 w-3.5 text-[#25D366]" />
              <span>Add to Pack Slot</span>
            </button>
          )}

          {/* Action 3: Download Full Pack (.wastickers) */}
          <button
            type="button"
            onClick={handleExportFullPack}
            disabled={isExportingPack}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-black text-black shadow-md shadow-emerald-500/20 hover:bg-[#20bd5a] transition-transform active:scale-95 cursor-pointer font-['Space_Grotesk']"
          >
            {isExportingPack ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            )}
            <span>Get Full Pack (WhatsApp)</span>
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
