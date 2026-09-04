"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BadgeCheck,
  Heart,
  Share2,
  ExternalLink,
  Download,
  Layers,
  Sparkles,
  Flame,
  Zap,
  Crown,
  Coffee,
  MapPin,
  Calendar,
  Check,
  Users,
  Compass,
  ArrowRight,
  Eye,
  Paintbrush,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DetailedCreatorProfile,
  CreatorBadge,
} from "../../src/types/creator";
import { ExplorePack, ExploreSticker } from "../../src/types/explore";
import { StickerPackRecord } from "../../src/types/pack";
import {
  getCreatorProfile,
  getCreatorPacks,
  getCreatorStickers,
  isCreatorFollowed,
  toggleFollowCreator,
} from "../../utils/creatorEngine";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import { ReactionBurst, useReactionBurst } from "../Explore/ReactionBurst";

interface CreatorProfileModalProps {
  username: string | null;
  isOpen: boolean;
  onClose: () => void;
  onInspectSticker: (sticker: ExploreSticker, pack: ExplorePack) => void;
  onClonePackToStudio: (studioPack: StickerPackRecord) => void;
  onExportPack: (pack: ExplorePack) => Promise<void>;
  onRemixInStudio?: (stickerUrl: string, stickerTitle?: string) => void;
  onShowNotice?: (message: string) => void;
}

export function CreatorProfileModal({
  username,
  isOpen,
  onClose,
  onInspectSticker,
  onClonePackToStudio,
  onExportPack,
  onRemixInStudio,
  onShowNotice,
}: CreatorProfileModalProps) {
  const [profile, setProfile] = useState<DetailedCreatorProfile | null>(null);
  const [packs, setPacks] = useState<ExplorePack[]>([]);
  const [stickers, setStickers] = useState<ExploreSticker[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCountOffset, setFollowerCountOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<"packs" | "stickers">("packs");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const { particles, triggerBurst, removeParticle } = useReactionBurst();

  // Load profile and related packs
  useEffect(() => {
    if (!username || !isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setFollowerCountOffset(0);

    Promise.all([
      getCreatorProfile(username),
      getCreatorPacks(username),
      getCreatorStickers(username),
      isCreatorFollowed(username),
    ])
      .then(([prof, creatorPacks, creatorStickers, followed]) => {
        if (!isMounted) return;
        setProfile(prof);
        setPacks(creatorPacks);
        setStickers(creatorStickers);
        setIsFollowing(followed);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load creator profile:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username, isOpen]);

  // Handle follow toggle
  const handleToggleFollow = async () => {
    if (!profile) return;
    try {
      const nextFollow = await toggleFollowCreator(profile.username);
      setIsFollowing(nextFollow);
      setFollowerCountOffset((prev) => (nextFollow ? prev + 1 : prev - 1));

      if (nextFollow) {
        triggerBurst("❤️", 10);
        onShowNotice?.(`You are now following ${profile.name}!`);
      } else {
        onShowNotice?.(`Unfollowed ${profile.name}`);
      }
    } catch (err) {
      console.warn("Toggle follow error:", err);
    }
  };

  // Handle sharing creator profile
  const handleShareProfile = async () => {
    if (!profile) return;
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?creator=${encodeURIComponent(profile.username)}`
      : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} (@${profile.username}) on Omoji Stickers`,
          text: `Check out WhatsApp sticker packs crafted by ${profile.name}!`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      triggerBurst("🔗", 6);
      onShowNotice?.(`Copied creator link to clipboard!`);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowNotice?.("Could not copy link.");
    }
  };

  // Badge icon renderer
  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "BadgeCheck":
        return <BadgeCheck className="h-3.5 w-3.5" />;
      case "Flame":
        return <Flame className="h-3.5 w-3.5" />;
      case "Zap":
        return <Zap className="h-3.5 w-3.5" />;
      case "Crown":
        return <Crown className="h-3.5 w-3.5" />;
      case "Sparkles":
        return <Sparkles className="h-3.5 w-3.5" />;
      case "Coffee":
        return <Coffee className="h-3.5 w-3.5" />;
      default:
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      className="p-0 sm:p-0 overflow-hidden"
    >
      <div className="relative">
        <ReactionBurst particles={particles} onComplete={removeParticle} />

        {isLoading || !profile ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Sparkles className="h-8 w-8 animate-spin text-[#25D366] mb-3" />
            <p className="text-xs font-bold font-['Space_Grotesk']">Loading Creator Dossier...</p>
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {/* Top Dynamic Bento Cover Banner */}
            <div
              className="relative h-32 sm:h-40 w-full overflow-hidden p-4 flex items-end justify-between"
              style={{
                background: `linear-gradient(135deg, ${profile.bannerGradient[0]} 0%, ${profile.bannerGradient[1]} 100%)`,
              }}
            >
              {/* Subtle noise/grid texture */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              {/* Top Banner Badges */}
              <div className="relative z-10 flex items-center gap-2">
                <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold text-white border border-white/20 uppercase tracking-wider font-['Space_Grotesk']">
                  {profile.specialtyTag}
                </span>
              </div>

              {/* Action Buttons on Banner */}
              <div className="relative z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="flex items-center gap-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-white/20 transition-all active:scale-95 cursor-pointer font-['Space_Grotesk']"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-[#25D366]" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Link Copied" : "Share Profile"}</span>
                </button>
              </div>
            </div>

            {/* Profile Info Header Bar */}
            <div className="px-5 sm:px-6">
              <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
                {/* Avatar with Thick Die-Cut Border */}
                <div className="flex items-end gap-3.5">
                  <div className="relative group">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl border-4 border-white dark:border-[#111b21] bg-slate-100 dark:bg-[#182229] object-cover shadow-xl"
                    />
                    {profile.verified && (
                      <div
                        title="Verified Omoji Creator"
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md border-2 border-white dark:border-[#111b21]"
                      >
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Space_Grotesk'] tracking-tight">
                        {profile.name}
                      </h2>
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                      @{profile.username}
                    </div>
                  </div>
                </div>

                {/* Follow Button & Follower Count */}
                <div className="flex items-center gap-2 self-start sm:self-end">
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md font-['Space_Grotesk'] ${
                      isFollowing
                        ? "bg-slate-100 dark:bg-[#182229] border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500"
                        : "bg-[#25D366] text-black hover:bg-[#20bd5a] shadow-emerald-500/20"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 transition-transform ${
                        isFollowing ? "fill-rose-500 text-rose-500 scale-110" : ""
                      }`}
                    />
                    <span>{isFollowing ? "Following" : "Follow Creator"}</span>
                  </button>
                </div>
              </div>

              {/* Bio & Meta Row */}
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {profile.bio}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Member since {profile.joinedDate}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                    <Users className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>
                      {(profile.stats.followersCount + followerCountOffset).toLocaleString()} followers
                    </span>
                  </div>
                </div>

                {/* Social & Support Links */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <span>𝕏 Twitter</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  )}

                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <span>📸 Instagram</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  )}

                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <span>🌐 Portfolio</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  )}

                  {profile.socialLinks.tipLink && (
                    <a
                      href={profile.socialLinks.tipLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      <Coffee className="h-3.5 w-3.5" />
                      <span>Support Artist</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Bento Grid: Metrics & Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#182229] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Downloads
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-['Space_Grotesk'] mt-0.5">
                    {profile.stats.totalDownloads.toLocaleString()}+
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#182229] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Community Likes
                  </div>
                  <div className="text-lg sm:text-xl font-black text-rose-500 font-['Space_Grotesk'] mt-0.5">
                    {profile.stats.totalLikes.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#182229] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Published Packs
                  </div>
                  <div className="text-lg sm:text-xl font-black text-[#25D366] font-['Space_Grotesk'] mt-0.5">
                    {packs.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#182229] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Virality Rating
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-500 font-['Space_Grotesk'] mt-0.5">
                    {profile.stats.viralityScore || 95}%
                  </div>
                </div>
              </div>

              {/* Creator Trophies / Badges Shelf */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-4 p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/50 dark:bg-black/20">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Honors & Community Badges
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((b) => (
                      <div
                        key={b.id}
                        title={b.description}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${b.bgClass} ${b.borderClass} ${b.colorClass}`}
                      >
                        {renderBadgeIcon(b.icon)}
                        <span>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tabs: Published Packs vs All Stickers */}
              <div className="mt-6 border-b border-slate-200 dark:border-white/10 pb-3 flex items-center justify-between">
                <div className="flex items-center bg-slate-100 dark:bg-[#182229] p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs font-bold font-['Space_Grotesk']">
                  <button
                    type="button"
                    onClick={() => setActiveTab("packs")}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                      activeTab === "packs"
                        ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>Published Packs ({packs.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("stickers")}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                      activeTab === "stickers"
                        ? "bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>All Stickers ({stickers.length})</span>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="mt-4">
                {activeTab === "packs" ? (
                  <div className="space-y-4">
                    {packs.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        No published packs found for this creator yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {packs.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] p-4 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all"
                          >
                            <div>
                              <div className="flex items-start gap-3 mb-3">
                                <img
                                  src={p.trayIconUrl}
                                  alt={p.title}
                                  className="h-11 w-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] object-contain p-0.5 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-black text-sm text-slate-900 dark:text-white font-['Space_Grotesk'] truncate">
                                    {p.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    {p.description}
                                  </p>
                                </div>
                              </div>

                              {/* Preview Stickers */}
                              <div className="grid grid-cols-4 gap-1.5 mb-3 p-1.5 rounded-xl bg-slate-50 dark:bg-[#182229]">
                                {p.stickers.slice(0, 4).map((stk) => (
                                  <div
                                    key={stk.id}
                                    onClick={() => onInspectSticker(stk, p)}
                                    className="aspect-square rounded-lg bg-white dark:bg-[#111b21] p-1 border border-slate-200/60 dark:border-white/10 hover:scale-105 transition-transform cursor-pointer"
                                  >
                                    <img
                                      src={stk.imageUrl}
                                      alt="Sticker"
                                      className="h-full w-full object-contain pointer-events-none"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                              <button
                                type="button"
                                onClick={() => onExportPack(p)}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-black text-black shadow-xs hover:bg-[#20bd5a] transition-all cursor-pointer font-['Space_Grotesk']"
                              >
                                <Download className="h-3 w-3 stroke-[2.5]" />
                                <span>Get Pack</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  import("../../utils/exploreEngine").then(({ convertExplorePackToStudioPack }) => {
                                    const studioPack = convertExplorePackToStudioPack(p);
                                    onClonePackToStudio(studioPack);
                                  });
                                }}
                                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-2 text-xs font-bold text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-[#202c33] transition-all cursor-pointer font-['Space_Grotesk']"
                              >
                                <Layers className="h-3 w-3 text-[#25D366]" />
                                <span>Studio</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* All Individual Stickers Grid */
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {stickers.map((stk) => {
                      const parentPack = packs.find((p) => p.id === stk.packId) || packs[0];

                      return (
                        <div
                          key={stk.id}
                          className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-2 hover:border-[#25D366] transition-all shadow-xs"
                        >
                          <div
                            onClick={() => {
                              if (parentPack) onInspectSticker(stk, parentPack);
                            }}
                            className="aspect-square rounded-lg bg-slate-50 dark:bg-[#182229] p-1.5 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                          >
                            <img
                              src={stk.imageUrl}
                              alt={stk.title || "Sticker"}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-contain pointer-events-none drop-shadow-xs"
                            />
                          </div>

                          <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate font-['Space_Grotesk']">
                              {stk.title || "Sticker"}
                            </span>

                            {onRemixInStudio && (
                              <button
                                type="button"
                                onClick={() => onRemixInStudio(stk.imageUrl, stk.title)}
                                title="Remix in Studio"
                                className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-[#25D366] hover:text-black transition-colors cursor-pointer"
                              >
                                <Paintbrush className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
