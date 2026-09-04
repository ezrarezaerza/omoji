/**
 * Explore Catalog & Community Data Architecture
 * Schemas for ExploreSticker, ExplorePack, CategoryTag, and CreatorInfo
 */

export type CategoryTag =
  | "Trending"
  | "Memes"
  | "Cute Animals"
  | "Slang"
  | "Anime"
  | "Daily";

export const EXPLORE_CATEGORIES: readonly CategoryTag[] = [
  "Trending",
  "Memes",
  "Cute Animals",
  "Slang",
  "Anime",
  "Daily",
] as const;

export interface CategoryDefinition {
  tag: CategoryTag;
  label: string;
  description: string;
  iconName: string;
  accentColor: string;
  badgeBg: string;
  gradientBg: string;
}

export interface CreatorInfo {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified?: boolean;
  bio?: string;
  badge?: string;
  packsCount?: number;
  totalDownloads?: number;
}

export interface ExploreSticker {
  id: string;
  packId: string;
  imageUrl: string;
  emojis: string[];
  title?: string;
  isAnimated: boolean;
  tags: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number; // In bytes
  likesCount?: number;
}

export interface ExplorePack {
  id: string;
  title: string;
  description: string;
  trayIconUrl: string;
  category: CategoryTag;
  tags: string[];
  creator: CreatorInfo;
  stickers: ExploreSticker[];
  stickerCount: number;
  downloadCount: number;
  likesCount: number;
  rating?: number; // 0.0 - 5.0
  isFeatured?: boolean;
  isTrending?: boolean;
  isAnimated?: boolean;
  isCustomPublished?: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export type ExploreSortOption =
  | "trending"
  | "popular"
  | "newest"
  | "rating"
  | "alphabetical";

export type ExploreMediaType = "all" | "static" | "animated";

export interface ExploreQueryParams {
  query?: string;
  category?: CategoryTag | "All";
  mediaType?: ExploreMediaType;
  sort?: ExploreSortOption;
  creatorId?: string;
  featuredOnly?: boolean;
  onlyFavorites?: boolean;
  limit?: number;
  offset?: number;
}

export interface ExploreQueryResult {
  packs: ExplorePack[];
  totalCount: number;
  categories: { tag: CategoryTag; count: number }[];
  hasMore: boolean;
  favoritedPackIds: string[];
}
