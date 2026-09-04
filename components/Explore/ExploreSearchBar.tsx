"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal, Sparkles, Film, Image as ImageIcon } from "lucide-react";
import { ExploreMediaType, ExploreSortOption } from "../../src/types/explore";

interface ExploreSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mediaType: ExploreMediaType;
  onMediaTypeChange: (mediaType: ExploreMediaType) => void;
  sortOption: ExploreSortOption;
  onSortChange: (sort: ExploreSortOption) => void;
  totalResults: number;
}

const TRENDING_TAGS = [
  "neon",
  "corgi",
  "frfr",
  "gigachad",
  "coffee",
  "chibi",
  "sigma",
  "slay",
  "ramen",
  "work",
];

export function ExploreSearchBar({
  searchQuery,
  onSearchChange,
  mediaType,
  onMediaTypeChange,
  sortOption,
  onSortChange,
  totalResults,
}: ExploreSearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external search query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced emit
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 250);
  };

  const handleClear = () => {
    setLocalQuery("");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    onSearchChange("");
  };

  const handleTagClick = (tag: string) => {
    const nextVal = tag;
    setLocalQuery(nextVal);
    onSearchChange(nextVal);
  };

  return (
    <div className="w-full space-y-3">
      {/* Primary Input & Filter Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4 stroke-[2.2]" />
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder="Search packs, tags, emojis (#memes, shiba, ☕, frfr)..."
            className="w-full rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] py-2.5 pl-10 pr-10 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-['Space_Grotesk']"
          />
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right Filter Toolbar: Media Type & Sort */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Media Type Toggle: All / Static / Animated */}
          <div className="flex items-center rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => onMediaTypeChange("all")}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                mediaType === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onMediaTypeChange("static")}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                mediaType === "static"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              <span>Static</span>
            </button>
            <button
              type="button"
              onClick={() => onMediaTypeChange("animated")}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                mediaType === "animated"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Film className="h-3 w-3" />
              <span>Animated</span>
            </button>
          </div>

          {/* Sort Selection */}
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3 text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as ExploreSortOption)}
              className="appearance-none rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] py-2 pl-9 pr-8 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm outline-none focus:border-[#25D366] cursor-pointer"
            >
              <option value="trending">🔥 Trending</option>
              <option value="popular">⚡ Most Popular</option>
              <option value="newest">✨ Newest First</option>
              <option value="rating">⭐ Top Rated</option>
              <option value="alphabetical">🔤 A-Z Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trending Tags Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Hot Tags:</span>
        </div>
        {TRENDING_TAGS.map((tag) => {
          const isSelected = localQuery.toLowerCase().includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[#25D366]/20 text-emerald-800 dark:text-emerald-300 border border-[#25D366]/40"
                  : "bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
