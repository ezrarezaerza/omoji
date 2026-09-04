"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Flame,
  Laugh,
  Cat,
  MessageSquareQuote,
  Sparkles,
  Coffee,
  Layers,
  Heart,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CategoryTag, EXPLORE_CATEGORIES } from "../../src/types/explore";

interface CategoryPillBarProps {
  selectedCategory: CategoryTag | "All";
  onlyFavorites: boolean;
  onlyFollowing?: boolean;
  onSelectCategory: (category: CategoryTag | "All") => void;
  onToggleFavorites: (active: boolean) => void;
  onToggleFollowing?: (active: boolean) => void;
  categoryCounts: { tag: CategoryTag; count: number }[];
  totalPacksCount: number;
  favoritePacksCount: number;
  followingPacksCount?: number;
}

export function CategoryPillBar({
  selectedCategory,
  onlyFavorites,
  onlyFollowing = false,
  onSelectCategory,
  onToggleFavorites,
  onToggleFollowing,
  categoryCounts,
  totalPacksCount,
  favoritePacksCount,
  followingPacksCount = 0,
}: CategoryPillBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const offset = direction === "left" ? -240 : 240;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const getCategoryIcon = (tag: string) => {
    switch (tag) {
      case "Trending":
        return <Flame className="h-3.5 w-3.5" />;
      case "Memes":
        return <Laugh className="h-3.5 w-3.5" />;
      case "Cute Animals":
        return <Cat className="h-3.5 w-3.5" />;
      case "Slang":
        return <MessageSquareQuote className="h-3.5 w-3.5" />;
      case "Anime":
        return <Sparkles className="h-3.5 w-3.5" />;
      case "Daily":
        return <Coffee className="h-3.5 w-3.5" />;
      default:
        return <Layers className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="relative w-full py-1">
      {/* Left Scroll Gradient Fade Mask & Button */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-6 bg-gradient-to-r from-slate-100 via-slate-100/90 to-transparent dark:from-[#0b141a] dark:via-[#0b141a]/90 pointer-events-none">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-[#1f2c34] text-slate-700 dark:text-slate-200 shadow-md border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#2a3942] transition-transform active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Right Scroll Gradient Fade Mask & Button */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-6 bg-gradient-to-l from-slate-100 via-slate-100/90 to-transparent dark:from-[#0b141a] dark:via-[#0b141a]/90 pointer-events-none">
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-[#1f2c34] text-slate-700 dark:text-slate-200 shadow-md border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#2a3942] transition-transform active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Scrollable Chip Row */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {/* "All" Category Pill */}
        <button
          type="button"
          onClick={() => {
            onToggleFavorites(false);
            onToggleFollowing?.(false);
            onSelectCategory("All");
          }}
          className={`group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            !onlyFavorites && !onlyFollowing && selectedCategory === "All"
              ? "bg-[#25D366] text-black shadow-md shadow-emerald-500/20 scale-[1.02]"
              : "bg-white dark:bg-[#111b21] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-[#25D366]/40 hover:bg-slate-50 dark:hover:bg-[#182229]"
          }`}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-nowrap font-['Space_Grotesk']">All Packs</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              !onlyFavorites && !onlyFollowing && selectedCategory === "All"
                ? "bg-black/20 text-black"
                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
            }`}
          >
            {totalPacksCount}
          </span>
        </button>

        {/* Favorites Bookmarked Pill */}
        <button
          type="button"
          onClick={() => {
            onToggleFollowing?.(false);
            onToggleFavorites(!onlyFavorites);
          }}
          className={`group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            onlyFavorites
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-[1.02]"
              : "bg-white dark:bg-[#111b21] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-rose-500/40 hover:bg-slate-50 dark:hover:bg-[#182229]"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 shrink-0 ${onlyFavorites ? "fill-white" : "text-rose-500"}`} />
          <span className="whitespace-nowrap font-['Space_Grotesk']">My Favorites</span>
          {favoritePacksCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                onlyFavorites
                  ? "bg-white/20 text-white"
                  : "bg-rose-500/15 text-rose-500"
              }`}
            >
              {favoritePacksCount}
            </span>
          )}
        </button>

        {/* Following Creators Pill */}
        <button
          type="button"
          onClick={() => {
            onToggleFavorites(false);
            onToggleFollowing?.(!onlyFollowing);
          }}
          className={`group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            onlyFollowing
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-[1.02]"
              : "bg-white dark:bg-[#111b21] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-purple-500/40 hover:bg-slate-50 dark:hover:bg-[#182229]"
          }`}
        >
          <Users className={`h-3.5 w-3.5 shrink-0 ${onlyFollowing ? "text-white" : "text-purple-500"}`} />
          <span className="whitespace-nowrap font-['Space_Grotesk']">Following</span>
          {followingPacksCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                onlyFollowing
                  ? "bg-white/20 text-white"
                  : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
              }`}
            >
              {followingPacksCount}
            </span>
          )}
        </button>

        {/* Individual Core Categories */}
        {EXPLORE_CATEGORIES.map((catTag) => {
          const isSelected = !onlyFavorites && selectedCategory === catTag;
          const countItem = categoryCounts.find((c) => c.tag === catTag);
          const count = countItem ? countItem.count : 0;

          return (
            <button
              key={catTag}
              type="button"
              onClick={() => {
                onToggleFavorites(false);
                onSelectCategory(catTag);
              }}
              className={`group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02] border-transparent"
                  : "bg-white dark:bg-[#111b21] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-[#182229]"
              }`}
            >
              <span className={isSelected ? "text-[#25D366]" : "text-slate-500 dark:text-slate-400"}>
                {getCategoryIcon(catTag)}
              </span>
              <span className="whitespace-nowrap font-['Space_Grotesk']">{catTag}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  isSelected
                    ? "bg-white/20 dark:bg-black/20 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
