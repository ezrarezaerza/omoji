"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Layers, Download, Flame, Heart, Info, ArrowUpRight, Compass, User, Users, Share2 } from "lucide-react";
import {
  CategoryTag,
  ExploreMediaType,
  ExplorePack,
  ExploreSortOption,
  ExploreSticker,
} from "../../src/types/explore";
import {
  queryExplorePacks,
  convertExplorePackToStudioPack,
} from "../../utils/exploreEngine";
import {
  getAllFavoritePackIds,
  getAllFavoriteStickerIds,
  toggleFavoritePack,
} from "../../utils/exploreDb";
import { getAllFollowedCreatorUsernames } from "../../utils/creatorEngine";
import { CategoryPillBar } from "./CategoryPillBar";
import { ExploreSearchBar } from "./ExploreSearchBar";
import { ExploreBentoGrid } from "./ExploreBentoGrid";
import { StickerInspectorModal } from "./StickerInspectorModal";
import { SavedFavoritesView } from "./SavedFavoritesView";
import { FeaturedCreatorsBar } from "./FeaturedCreatorsBar";
import { CreatorProfileModal } from "../Creator/CreatorProfileModal";
import { MyCreatorProfileModal } from "../Creator/MyCreatorProfileModal";
import { SharePackModal } from "../Creator/SharePackModal";
import { StickerPackRecord } from "../../src/types/pack";

interface ExploreFeedProps {
  onClonePackToStudio: (studioPack: StickerPackRecord) => void;
  onExportPack: (pack: StickerPackRecord) => Promise<void>;
  onRemixInStudio?: (stickerUrl: string, stickerTitle?: string) => void;
  onOpenStudioPack?: (studioPack: StickerPackRecord, slotIndex?: number) => void;
  onShowNotice?: (message: string) => void;
  onRequestStudioTab?: () => void;
}

export function ExploreFeed({
  onClonePackToStudio,
  onExportPack,
  onRemixInStudio,
  onOpenStudioPack,
  onShowNotice,
  onRequestStudioTab,
}: ExploreFeedProps) {
  const [viewMode, setViewMode] = useState<"catalog" | "saved">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<CategoryTag | "All">("All");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyFollowing, setOnlyFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState<ExploreMediaType>("all");
  const [sortOption, setSortOption] = useState<ExploreSortOption>("trending");

  const [packs, setPacks] = useState<ExplorePack[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ tag: CategoryTag; count: number }[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [favoritedPackIds, setFavoritedPackIds] = useState<string[]>([]);
  const [followedUsernames, setFollowedUsernames] = useState<string[]>([]);
  const [followingPacksCount, setFollowingPacksCount] = useState(0);
  const [savedStickerCount, setSavedStickerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Selected sticker modal state
  const [previewSticker, setPreviewSticker] = useState<{
    sticker: ExploreSticker;
    pack: ExplorePack;
  } | null>(null);

  // Selected creator dossier state (Phase 2)
  const [selectedCreatorUsername, setSelectedCreatorUsername] = useState<string | null>(null);

  // My Creator Profile editor state (Phase 3)
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState(false);

  // Share Modal state (Phase 4)
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    type: "pack" | "creator";
    title: string;
    creatorName?: string;
    creatorUsername?: string;
    shareUrl: string;
    imageUrl?: string;
    stickersCount?: number;
  } | null>(null);

  // Deep-linking URL handler: check ?creator= or ?c= query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const readCreatorFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const creatorParam = params.get("creator") || params.get("c");
      if (creatorParam) {
        setSelectedCreatorUsername(creatorParam.toLowerCase().trim());
      }
    };

    readCreatorFromUrl();
    window.addEventListener("popstate", readCreatorFromUrl);
    return () => {
      window.removeEventListener("popstate", readCreatorFromUrl);
    };
  }, []);

  // Synchronize URL when selectedCreatorUsername changes
  const handleOpenCreator = useCallback((username: string) => {
    const clean = username.toLowerCase().replace(/^@/, "").trim();
    setSelectedCreatorUsername(clean);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("creator", clean);
      window.history.pushState({ creator: clean }, "", url.toString());
    }
  }, []);

  const handleCloseCreator = useCallback(() => {
    setSelectedCreatorUsername(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("creator");
      url.searchParams.delete("c");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Fetch / Query catalog
  const refreshExplore = useCallback(async () => {
    try {
      const [result, favStickers, follows] = await Promise.all([
        queryExplorePacks({
          query: searchQuery,
          category: (onlyFavorites || onlyFollowing) ? undefined : selectedCategory,
          mediaType,
          sort: sortOption,
          onlyFavorites,
          limit: 50,
        }),
        getAllFavoriteStickerIds(),
        getAllFollowedCreatorUsernames(),
      ]);

      const cleanFollows = follows.map((u) => u.toLowerCase().replace(/^@/, ""));
      setFollowedUsernames(cleanFollows);

      // Compute packs matching followed creators across the loaded collection
      const followedPacks = result.packs.filter((p) =>
        cleanFollows.includes(p.creator.username.toLowerCase().replace(/^@/, ""))
      );
      setFollowingPacksCount(followedPacks.length);

      if (onlyFollowing) {
        setPacks(followedPacks);
      } else {
        setPacks(result.packs);
      }

      setTotalCount(result.totalCount);
      setCategoryCounts(result.categories);
      setFavoritedPackIds(result.favoritedPackIds);
      setSavedStickerCount(favStickers.length);
    } catch (err) {
      console.error("Failed to query explore catalog:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, mediaType, sortOption, onlyFavorites, onlyFollowing]);

  useEffect(() => {
    refreshExplore();
  }, [refreshExplore]);

  // Listen to external favorite and follow updates
  useEffect(() => {
    const handleFavChange = () => {
      getAllFavoritePackIds().then(setFavoritedPackIds);
      getAllFavoriteStickerIds().then((ids) => setSavedStickerCount(ids.length));
    };

    const handleCatalogChange = () => {
      refreshExplore();
    };

    window.addEventListener("omoji:favorites_changed", handleFavChange);
    window.addEventListener("omoji:catalog_updated", handleCatalogChange);
    window.addEventListener("omoji:creator_followed", handleCatalogChange);
    return () => {
      window.removeEventListener("omoji:favorites_changed", handleFavChange);
      window.removeEventListener("omoji:catalog_updated", handleCatalogChange);
      window.removeEventListener("omoji:creator_followed", handleCatalogChange);
    };
  }, [refreshExplore]);

  const handleToggleFavorite = async (packId: string) => {
    const isNowFavorited = await toggleFavoritePack(packId);
    setFavoritedPackIds((prev) =>
      isNowFavorited ? [...prev, packId] : prev.filter((id) => id !== packId)
    );
    if (onShowNotice) {
      onShowNotice(
        isNowFavorited ? "❤️ Added pack to your favorites!" : "Removed pack from favorites."
      );
    }
  };

  const handleExportExplorePack = async (pack: ExplorePack) => {
    const studioPack = convertExplorePackToStudioPack(pack);
    await onExportPack(studioPack);
  };

  const handleCloneToStudio = (pack: ExplorePack) => {
    const studioPack = convertExplorePackToStudioPack(pack);
    onClonePackToStudio(studioPack);
    if (onShowNotice) {
      onShowNotice(`✨ Cloned "${pack.title}" to your Sticker Studio!`);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setOnlyFavorites(false);
    setSearchQuery("");
    setMediaType("all");
    setSortOption("trending");
  };

  return (
    <div className="space-y-6">
      {/* High-Contrast Bento Hero Banner & Mode Switcher */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-slate-900 via-[#111b21] to-[#128C7E] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/20 border border-[#25D366]/30 px-3 py-1 text-xs font-black text-[#25D366] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Explore Community Vault</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-['Space_Grotesk']">
              Curated WhatsApp Sticker Packs
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Discover viral trending stickers, classic memes, fluffy animals, and anime reactions. Download instantly to WhatsApp or clone directly into your studio.
            </p>
          </div>

          {/* Sub-view switcher & Quick Metrics */}
          <div className="flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center bg-black/50 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md text-xs font-bold font-['Space_Grotesk']">
              <button
                type="button"
                onClick={() => {
                  setViewMode("catalog");
                  setOnlyFavorites(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "catalog"
                    ? "bg-[#25D366] text-black shadow-md"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>Browse Catalog</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("saved")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "saved"
                    ? "bg-rose-500 text-white shadow-md"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Heart className={`h-4 w-4 ${viewMode === "saved" ? "fill-white" : "fill-rose-400"}`} />
                <span>Saved & Favorites</span>
                {(savedStickerCount > 0 || favoritedPackIds.length > 0) && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {savedStickerCount + favoritedPackIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Metrics Bento Box */}
            <div className="grid grid-cols-3 gap-2 shrink-0 rounded-2xl bg-black/40 border border-white/10 p-3 backdrop-blur-md">
              <div className="text-center px-2">
                <div className="text-base sm:text-lg font-black font-['Space_Grotesk'] text-[#25D366]">
                  12+
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Curated Packs
                </div>
              </div>
              <div className="text-center px-2 border-x border-white/10">
                <div className="text-base sm:text-lg font-black font-['Space_Grotesk'] text-amber-400">
                  80+
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Stickers
                </div>
              </div>
              <div className="text-center px-2">
                <div className="text-base sm:text-lg font-black font-['Space_Grotesk'] text-cyan-400">
                  500k+
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Downloads
                </div>
              </div>
            </div>

            {/* My Creator Dossier Launcher Button */}
            <button
              type="button"
              onClick={() => setIsMyProfileModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer font-['Space_Grotesk'] shadow-sm"
            >
              <User className="h-3.5 w-3.5 text-[#25D366]" />
              <span>My Creator Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conditionally Render: Catalog Feed OR Dedicated Saved/Favorites Sub-View */}
      {viewMode === "saved" ? (
        <SavedFavoritesView
          onInspectSticker={(sticker, pack) => setPreviewSticker({ sticker, pack })}
          onRemixInStudio={(url, title) => {
            if (onRemixInStudio) onRemixInStudio(url, title);
          }}
          onClonePackToStudio={onClonePackToStudio}
          onExportPack={handleExportExplorePack}
          onOpenStudioPack={onOpenStudioPack}
          onOpenCreatorProfile={handleOpenCreator}
          onShowNotice={onShowNotice}
          onNavigateToFeed={() => {
            setViewMode("catalog");
            setOnlyFavorites(false);
          }}
        />
      ) : (
        <>
          {/* Top Featured Creators & Illustrators Shelf */}
          <FeaturedCreatorsBar
            onSelectCreator={handleOpenCreator}
            onShowNotice={onShowNotice}
          />

          {/* Category Pill Bar with Horizontal Scroll Fade */}
          <CategoryPillBar
            selectedCategory={selectedCategory}
            onlyFavorites={onlyFavorites}
            onlyFollowing={onlyFollowing}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setOnlyFollowing(false);
            }}
            onToggleFavorites={(active) => {
              if (active) {
                setViewMode("saved");
              } else {
                setOnlyFavorites(false);
              }
            }}
            onToggleFollowing={(active) => {
              setOnlyFollowing(active);
              if (active) {
                setViewMode("catalog");
                setOnlyFavorites(false);
              }
            }}
            categoryCounts={categoryCounts}
            totalPacksCount={totalCount}
            favoritePacksCount={favoritedPackIds.length}
            followingPacksCount={followingPacksCount}
          />

          {/* Search & Filter Toolbar with Trending Hot Tags */}
          <ExploreSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
            sortOption={sortOption}
            onSortChange={setSortOption}
            totalResults={packs.length}
          />

          {/* Main Responsive Bento Grid Layout */}
          <ExploreBentoGrid
            packs={packs}
            isLoading={isLoading}
            favoritedPackIds={favoritedPackIds}
            onToggleFavorite={handleToggleFavorite}
            onExportPack={handleExportExplorePack}
            onCloneToStudio={handleCloneToStudio}
            onSelectStickerPreview={(sticker, pack) =>
              setPreviewSticker({ sticker, pack })
            }
            onOpenCreatorProfile={handleOpenCreator}
            onClearFilters={handleClearFilters}
            onSharePack={(pack) => {
              setShareModalData({
                isOpen: true,
                type: "pack",
                title: pack.title,
                creatorName: pack.creator.name,
                creatorUsername: pack.creator.username,
                shareUrl: typeof window !== "undefined"
                  ? `${window.location.origin}${window.location.pathname}?creator=${encodeURIComponent(pack.creator.username)}`
                  : `/?creator=${encodeURIComponent(pack.creator.username)}`,
                imageUrl: pack.trayIconUrl || pack.stickers?.[0]?.imageUrl,
                stickersCount: pack.stickerCount,
              });
            }}
          />
        </>
      )}

      {/* Interactive Sticker Inspector Modal */}
      {previewSticker && (
        <StickerInspectorModal
          isOpen={Boolean(previewSticker)}
          sticker={previewSticker.sticker}
          pack={previewSticker.pack}
          onClose={() => setPreviewSticker(null)}
          onRemixInStudio={(url, title) => {
            if (onRemixInStudio) {
              onRemixInStudio(url, title);
            }
          }}
          onDownloadFullPack={handleExportExplorePack}
          onOpenStudioPack={(studioPack, slotIdx) => {
            if (onOpenStudioPack) {
              onOpenStudioPack(studioPack, slotIdx);
            }
          }}
          onOpenCreatorProfile={handleOpenCreator}
          onShowNotice={onShowNotice}
        />
      )}

      {/* Creator Profile Bento Dossier Modal (Phase 2) */}
      {selectedCreatorUsername && (
        <CreatorProfileModal
          username={selectedCreatorUsername}
          isOpen={Boolean(selectedCreatorUsername)}
          onClose={handleCloseCreator}
          onInspectSticker={(sticker, pack) => {
            handleCloseCreator();
            setPreviewSticker({ sticker, pack });
          }}
          onClonePackToStudio={onClonePackToStudio}
          onExportPack={handleExportExplorePack}
          onRemixInStudio={onRemixInStudio}
          onShowNotice={onShowNotice}
        />
      )}

      {/* My Creator Profile Dossier Modal (Phase 3) */}
      <MyCreatorProfileModal
        isOpen={isMyProfileModalOpen}
        onClose={() => setIsMyProfileModalOpen(false)}
        onProfileSaved={(updated) => {
          onShowNotice?.(`✨ Creator profile updated for @${updated.username}!`);
          refreshExplore();
        }}
        onPreviewPublicPage={(username) => {
          setIsMyProfileModalOpen(false);
          handleOpenCreator(username);
        }}
        onShowNotice={onShowNotice}
      />

      {/* Social Web Share Integration Modal (Phase 4) */}
      {shareModalData && (
        <SharePackModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData(null)}
          type={shareModalData.type}
          title={shareModalData.title}
          creatorName={shareModalData.creatorName}
          creatorUsername={shareModalData.creatorUsername}
          shareUrl={shareModalData.shareUrl}
          imageUrl={shareModalData.imageUrl}
          stickersCount={shareModalData.stickersCount}
          onShowNotice={onShowNotice}
        />
      )}
    </div>
  );
}
