"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Film,
  TrendingUp,
  RefreshCw,
  DownloadCloud,
} from "lucide-react";
import { GiphyItemResponse } from "../../app/api/search/giphy/route";
import { importAssetFromUrl } from "../../utils/importExternalAsset";

export interface MemeSearchProps {
  onImageSelected: (imageUrl: string, file: File) => void;
  onAnimatedFileSelected?: (file: File) => void;
  onAssetUrlSelected?: (url: string) => Promise<void> | void;
}

const POPULAR_TAGS = [
  "Trending",
  "Cat",
  "Doge",
  "Reaction",
  "Pepe",
  "Anime",
  "Happy",
  "Dance",
  "Mind Blown",
  "Shocked",
];

export function MemeSearch({
  onImageSelected,
  onAnimatedFileSelected,
  onAssetUrlSelected,
}: MemeSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<GiphyItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState("Trending");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce query input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search or trending GIFs
  const fetchGifs = useCallback(async (searchQuery: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = searchQuery
        ? `/api/search/giphy?q=${encodeURIComponent(searchQuery)}&limit=24`
        : `/api/search/giphy?limit=24`;

      const response = await fetch(endpoint, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response.");
      }

      const json = await response.json();
      if (json.data && Array.isArray(json.data)) {
        setItems(json.data);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Meme search fetch error:", err);
        setError("Unable to load memes. Please try again or check your query.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search on debounced query change
  useEffect(() => {
    fetchGifs(debouncedQuery);
  }, [debouncedQuery, fetchGifs]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    if (tag === "Trending") {
      setQuery("");
    } else {
      setQuery(tag);
    }
  };

  const handleSelectMeme = async (item: GiphyItemResponse) => {
    if (selectedItemId) return; // prevent multiple simultaneous downloads
    setSelectedItemId(item.id);
    setError(null);

    try {
      // Pick best media source (full GIF or MP4 or preview)
      const targetMediaUrl = item.fullUrl || item.previewUrl || item.mp4Url;
      if (!targetMediaUrl) {
        throw new Error("No valid media URL found for this meme.");
      }

      if (onAssetUrlSelected) {
        await onAssetUrlSelected(targetMediaUrl);
        return;
      }

      const file = await importAssetFromUrl(targetMediaUrl);
      const mime = file.type.toLowerCase();
      const isAnimated =
        mime.includes("gif") ||
        mime.includes("mp4") ||
        file.name.toLowerCase().endsWith(".gif") ||
        file.name.toLowerCase().endsWith(".mp4");

      if (isAnimated && onAnimatedFileSelected) {
        onAnimatedFileSelected(file);
      } else {
        const previewUrl = URL.createObjectURL(file);
        onImageSelected(previewUrl, file);
      }
    } catch (err: any) {
      console.error("Failed to select meme:", err);
      setError(err?.message || "Failed to download meme. Please try another one.");
    } finally {
      setSelectedItemId(null);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Sticky Search Bar & Category Filter */}
      <div className="space-y-3">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-zinc-400 pointer-events-none" />
          <input
            id="meme-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search millions of GIFs, memes & stickers on Giphy..."
            className="w-full rounded-2xl border-2 border-white/15 bg-white/[0.05] pl-12 pr-12 py-3.5 text-sm font-medium text-white placeholder-zinc-400 backdrop-blur-xl transition-all focus:border-amber-400 focus:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-amber-400/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveTag("Trending");
              }}
              className="absolute right-3.5 rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-1 shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> Hot:
          </span>
          {POPULAR_TAGS.map((tag) => {
            const isSelected = activeTag === tag && (tag === "Trending" ? !query : query.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md shadow-orange-500/25"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-semibold text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchGifs(debouncedQuery)}
            className="ml-auto flex items-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] hover:bg-rose-500/30 text-white"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </motion.div>
      )}

      {/* Bento Grid Results Container */}
      <div className="relative min-h-[300px] max-h-[460px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3 pr-2 scrollbar-thin scrollbar-thumb-white/20">
        {isLoading && items.length === 0 ? (
          // Loading Skeleton Grid
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl border border-white/10 bg-white/5 animate-pulse flex flex-col justify-end p-3"
              >
                <div className="h-3 w-3/4 bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center p-6">
            <Film className="h-10 w-10 text-zinc-500 mb-2" />
            <p className="text-sm font-bold text-zinc-300">No memes found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-zinc-400 mt-1">Try another search term or browse trending categories above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {items.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectMeme(item)}
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "border-amber-400 ring-4 ring-amber-400/30 shadow-xl shadow-amber-500/20"
                        : "border-white/10 bg-zinc-900/60 hover:border-amber-400/60 hover:shadow-lg hover:shadow-orange-500/10"
                    }`}
                  >
                    {/* Media Preview Image / GIF */}
                    <img
                      src={item.previewUrl || item.fullUrl}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient Overlay for Caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
                      <p className="text-[11px] font-bold text-white line-clamp-1 leading-tight font-['Space_Grotesk']">
                        {item.title || "Animated Meme"}
                      </p>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-mono text-amber-300 font-bold uppercase">
                        <Sparkles className="h-2.5 w-2.5" /> Tap to Craft
                      </span>
                    </div>

                    {/* Format Tag */}
                    <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-300 uppercase">
                      GIF
                    </div>

                    {/* Selected Loading Spinner Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 backdrop-blur-sm text-white">
                        <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-300 font-mono">
                          Importing asset...
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-400" /> Powered by Giphy API & CORS proxy
        </span>
        <span>Animated GIFs auto-format to 512×512</span>
      </div>
    </div>
  );
}

export default MemeSearch;
