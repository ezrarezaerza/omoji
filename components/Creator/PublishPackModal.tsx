"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Tag,
  Share2,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  User,
  X,
  Flame,
  Laugh,
  Cat,
  MessageSquareQuote,
  Coffee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BaseModal } from "../UI/BaseModal";
import { StickerPackRecord } from "../../src/types/pack";
import { CategoryTag, ExplorePack, ExploreSticker } from "../../src/types/explore";
import { getMyCreatorProfile } from "../../utils/creatorEngine";
import { publishCustomPack } from "../../utils/exploreDb";

interface PublishPackModalProps {
  pack: StickerPackRecord;
  isOpen: boolean;
  onClose: () => void;
  onPublishedSuccess?: (publishedPack: ExplorePack) => void;
  onOpenMyProfileEditor?: () => void;
  onNavigateToExplore?: () => void;
  onShowNotice?: (message: string) => void;
}

const CATEGORIES: { tag: CategoryTag; icon: any }[] = [
  { tag: "Memes", icon: Laugh },
  { tag: "Cute Animals", icon: Cat },
  { tag: "Trending", icon: Flame },
  { tag: "Slang", icon: MessageSquareQuote },
  { tag: "Anime", icon: Sparkles },
  { tag: "Daily", icon: Coffee },
];

export function PublishPackModal({
  pack,
  isOpen,
  onClose,
  onPublishedSuccess,
  onOpenMyProfileEditor,
  onNavigateToExplore,
  onShowNotice,
}: PublishPackModalProps) {
  const [title, setTitle] = useState(pack.title || "");
  const [description, setDescription] = useState(
    `An exclusive pack of ${pack.stickers?.length || 0} stickers ready for WhatsApp.`
  );
  const [category, setCategory] = useState<CategoryTag>("Memes");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["whatsapp", "stickers", "fun"]);
  const [selectedTrayUrl, setSelectedTrayUrl] = useState<string>(
    pack.trayIconUrl || (pack.stickers && pack.stickers[0]?.imageUrl) || ""
  );
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPackResult, setPublishedPackResult] = useState<ExplorePack | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const myProfile = getMyCreatorProfile();
  const stickersCount = pack.stickers?.length || 0;
  const isEligible = stickersCount >= 3;

  useEffect(() => {
    if (isOpen) {
      setTitle(pack.title || "");
      setDescription(`An exclusive pack of ${pack.stickers?.length || 0} stickers ready for WhatsApp.`);
      setSelectedTrayUrl(pack.trayIconUrl || (pack.stickers && pack.stickers[0]?.imageUrl) || "");
      setPublishedPackResult(null);
      setHasCopied(false);
    }
  }, [isOpen, pack]);

  const handleAddTag = () => {
    const clean = tagInput.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handlePublish = async () => {
    if (!isEligible || !acceptTerms) return;

    try {
      setIsPublishing(true);

      const packIdStr = pack.id.startsWith("pack-") ? pack.id : `pack-${pack.id}`;

      const exploreStickers: ExploreSticker[] = (pack.stickers || []).map((s, idx) => ({
        id: `sticker-${pack.id}-${idx}`,
        packId: packIdStr,
        imageUrl: s.imageUrl,
        title: `${title} #${idx + 1}`,
        emojis: s.emojis && s.emojis.length > 0 ? s.emojis : ["✨"],
        tags: [...tags, category.toLowerCase()],
        likesCount: 1,
        isAnimated: Boolean(s.isAnimated),
      }));

      const newExplorePack: ExplorePack = {
        id: packIdStr,
        title: title.trim() || pack.title || "Custom Sticker Pack",
        description: description.trim() || `Created by ${myProfile.name}`,
        category,
        tags: tags.length > 0 ? tags : ["whatsapp", "stickers"],
        trayIconUrl: selectedTrayUrl || (exploreStickers[0]?.imageUrl || ""),
        creator: {
          id: myProfile.id,
          name: myProfile.name,
          username: myProfile.username,
          avatarUrl: myProfile.avatarUrl,
          bio: myProfile.bio,
          verified: myProfile.verified,
        },
        stickers: exploreStickers,
        stickerCount: exploreStickers.length,
        downloadCount: 1,
        likesCount: 1,
        isFeatured: false,
        isTrending: true,
        isCustomPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await publishCustomPack(newExplorePack);
      setPublishedPackResult(newExplorePack);
      onPublishedSuccess?.(newExplorePack);
      onShowNotice?.(`🎉 Published "${newExplorePack.title}" to Community Feed!`);
    } catch (err: any) {
      console.error("Publishing pack error:", err);
      onShowNotice?.(err.message || "Failed to publish pack.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!publishedPackResult) return;
    const shareText = `Check out "${publishedPackResult.title}" sticker pack by @${myProfile.username} on Omoji! Export directly to WhatsApp: ${window.location.origin}/?creator=${myProfile.username}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/?creator=${myProfile.username}`;
    navigator.clipboard.writeText(url).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={publishedPackResult ? "Pack Published!" : "Publish Pack to Community"}
      subtitle={
        publishedPackResult
          ? "Your stickers are now live and discoverable in the Explore Community"
          : "Share your sticker set with creators and group chats worldwide"
      }
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pr-2 no-scrollbar">
        {publishedPackResult ? (
          /* Success Screen */
          <div className="flex flex-col items-center text-center py-4 space-y-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/15 text-[#25D366] border border-emerald-500/30 shadow-lg">
                <Sparkles className="h-10 w-10 animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-black">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                "{publishedPackResult.title}" is Live!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Attributed to <strong className="text-slate-800 dark:text-slate-200">@{myProfile.username}</strong> with {stickersCount} stickers. Anyone can now explore, install, or remix this pack.
              </p>
            </div>

            {/* Quick Share Actions Bento Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-black text-black shadow-md shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer font-['Space_Grotesk']"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Share to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-3 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                {hasCopied ? (
                  <>
                    <Check className="h-4 w-4 text-[#25D366]" />
                    <span className="text-[#25D366]">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-400" />
                    <span>Copy Creator Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="w-full flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Done
              </button>

              {onNavigateToExplore && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToExplore();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#25D366] hover:underline cursor-pointer font-['Space_Grotesk']"
                >
                  <span>View in Explore Community</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Publishing Form */
          <>
            {/* Eligibility Banner */}
            {!isEligible && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  WhatsApp packs require at least <strong>3 stickers</strong> before publishing. You currently have {stickersCount}. Please add more stickers in Pack Studio.
                </span>
              </div>
            )}

            {/* Pack Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                  Pack Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pixel Cyber Cats"
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                  Pack Story &amp; Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your pack to the community..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366] resize-none"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                Primary Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const isSelected = category === c.tag;
                  return (
                    <button
                      key={c.tag}
                      type="button"
                      onClick={() => setCategory(c.tag)}
                      className={`flex items-center gap-2 rounded-2xl p-2.5 text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "border-[#25D366] bg-emerald-500/10 text-slate-900 dark:text-white shadow-xs"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-[#25D366]" : "text-slate-400"}`} />
                      <span className="truncate">{c.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                Search Tags (Press Enter)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. cats, meme, neon..."
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tags Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tray Icon Picker */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                Select WhatsApp Tray / Cover Icon
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {(pack.stickers || []).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTrayUrl(s.imageUrl)}
                    className={`relative shrink-0 rounded-2xl p-1 border-2 transition-all cursor-pointer ${
                      selectedTrayUrl === s.imageUrl
                        ? "border-[#25D366] bg-emerald-500/10 scale-105 shadow-md"
                        : "border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={s.imageUrl}
                      alt={`Sticker ${idx + 1}`}
                      className="h-12 w-12 rounded-xl object-contain"
                    />
                    {selectedTrayUrl === s.imageUrl && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] text-black">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Creator Attribution Summary */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-[#111b21]/50 p-3">
              <div className="flex items-center gap-3">
                <img
                  src={myProfile.avatarUrl}
                  alt={myProfile.name}
                  className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Publishing as {myProfile.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    @{myProfile.username} • {myProfile.specialtyTag}
                  </div>
                </div>
              </div>

              {onOpenMyProfileEditor && (
                <button
                  type="button"
                  onClick={onOpenMyProfileEditor}
                  className="text-xs font-bold text-[#25D366] hover:underline cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#25D366] focus:ring-[#25D366]"
              />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                I agree to publish this pack to the open Omoji Community under Creative Commons for WhatsApp sticker usage and respectful remixing.
              </span>
            </label>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 dark:border-white/15 px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={!isEligible || !acceptTerms || isPublishing || !title.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#25D366] px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/25 hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-['Space_Grotesk']"
              >
                {isPublishing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Publish to Community</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
