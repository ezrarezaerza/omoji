"use client";

import React, { useState, useEffect } from "react";
import { BadgeCheck, Users, Sparkles, Flame, ChevronRight, Heart } from "lucide-react";
import { DetailedCreatorProfile } from "../../src/types/creator";
import { getTrendingCreators, isCreatorFollowed, toggleFollowCreator } from "../../utils/creatorEngine";

interface FeaturedCreatorsBarProps {
  onSelectCreator: (username: string) => void;
  onShowNotice?: (message: string) => void;
}

export function FeaturedCreatorsBar({
  onSelectCreator,
  onShowNotice,
}: FeaturedCreatorsBarProps) {
  const [creators, setCreators] = useState<DetailedCreatorProfile[]>([]);
  const [followedUsernames, setFollowedUsernames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getTrendingCreators(7)
      .then(async (list) => {
        if (!isMounted) return;
        setCreators(list);
        const checks = await Promise.all(
          list.map(async (c) => ({
            username: c.username,
            followed: await isCreatorFollowed(c.username),
          }))
        );
        if (isMounted) {
          setFollowedUsernames(checks.filter((chk) => chk.followed).map((c) => c.username));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load trending creators:", err);
        if (isMounted) setIsLoading(false);
      });

    const handleFollowEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ username: string; isFollowing: boolean }>;
      if (customEvent.detail) {
        const { username, isFollowing } = customEvent.detail;
        setFollowedUsernames((prev) =>
          isFollowing ? [...prev, username] : prev.filter((u) => u !== username)
        );
      }
    };

    window.addEventListener("omoji:creator_followed", handleFollowEvent);
    return () => {
      isMounted = false;
      window.removeEventListener("omoji:creator_followed", handleFollowEvent);
    };
  }, []);

  const handleQuickFollow = async (e: React.MouseEvent, username: string, name: string) => {
    e.stopPropagation();
    try {
      const nextFollow = await toggleFollowCreator(username);
      setFollowedUsernames((prev) =>
        nextFollow ? [...prev, username] : prev.filter((u) => u !== username)
      );
      if (nextFollow) {
        onShowNotice?.(`❤️ You followed ${name}!`);
      }
    } catch (err) {
      console.warn("Quick follow error:", err);
    }
  };

  if (isLoading || creators.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <Flame className="h-3.5 w-3.5 fill-orange-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-['Space_Grotesk'] tracking-tight">
            Top Sticker Illustrators & Creators
          </h3>
          <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-400">
            Verified
          </span>
        </div>

        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline-block font-mono">
          Tap creator to view dossier & packs
        </span>
      </div>

      {/* Horizontal Scroll Shelf with Subtle Card Hover Elevation */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
        {creators.map((creator) => {
          const isFollowed = followedUsernames.includes(creator.username);

          return (
            <div
              key={creator.id}
              onClick={() => onSelectCreator(creator.username)}
              className="group flex-shrink-0 flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] p-2.5 pr-3.5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer select-none max-w-[240px]"
            >
              <div className="relative shrink-0">
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-11 w-11 rounded-xl object-cover border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform"
                />
                {creator.verified && (
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md bg-blue-500 text-white shadow-xs">
                    <BadgeCheck className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="font-black text-xs text-slate-900 dark:text-white font-['Space_Grotesk'] truncate group-hover:text-[#25D366] transition-colors">
                    {creator.name}
                  </h4>
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate font-mono">
                  @{creator.username}
                </div>
                <div className="mt-0.5 text-[9px] font-semibold text-slate-400 truncate">
                  {creator.specialtyTag}
                </div>
              </div>

              {/* 1-Tap Quick Follow Button */}
              <button
                type="button"
                onClick={(e) => handleQuickFollow(e, creator.username, creator.name)}
                title={isFollowed ? "Following" : "Follow Creator"}
                className={`flex h-7 w-7 items-center justify-center rounded-xl border transition-all active:scale-90 cursor-pointer shrink-0 ${
                  isFollowed
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                    : "border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isFollowed ? "fill-rose-500" : ""}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
