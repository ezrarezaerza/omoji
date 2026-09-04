/**
 * Explore Catalog Indexing, Search & Querying Engine
 * Provides local inverted indexing, category filtering, animated/static filter,
 * popularity/trending ranking, and bidirectional conversion with Studio packs.
 */

import { CURATED_EXPLORE_PACKS } from "../src/data/exploreCatalog";
import {
  CategoryTag,
  EXPLORE_CATEGORIES,
  ExplorePack,
  ExploreQueryParams,
  ExploreQueryResult,
  ExploreSticker,
} from "../src/types/explore";
import {
  getAllFavoritePackIds,
  getCustomPublishedPacks,
  publishCustomPack,
} from "./exploreDb";
import { StickerPackRecord, StickerRecord } from "../src/types/pack";

/**
 * Normalizes text for search indexing (lowercase, stripped punctuation)
 */
function normalizeSearchText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .trim();
}

/**
 * Calculates search relevance score between query terms and an ExplorePack
 */
function calculateSearchRelevance(pack: ExplorePack, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 1;

  let score = 0;
  const titleNorm = normalizeSearchText(pack.title);
  const descNorm = normalizeSearchText(pack.description);
  const creatorNorm = normalizeSearchText(`${pack.creator.name} ${pack.creator.username}`);
  const tagsNorm = pack.tags.map((t) => normalizeSearchText(t));
  const stickersTitleNorm = pack.stickers.map((s) => normalizeSearchText(s.title || ""));
  const stickersTagsNorm = pack.stickers.flatMap((s) => s.tags.map((t) => normalizeSearchText(t)));
  const stickersEmojis = pack.stickers.flatMap((s) => s.emojis);

  for (const term of queryTerms) {
    if (!term) continue;

    // Exact title match gets supreme priority
    if (titleNorm === term) {
      score += 100;
    } else if (titleNorm.includes(term)) {
      score += 40;
    }

    // Tags matches
    if (tagsNorm.some((t) => t === term)) {
      score += 30;
    } else if (tagsNorm.some((t) => t.includes(term))) {
      score += 15;
    }

    // Emoji matches
    if (stickersEmojis.includes(term)) {
      score += 35;
    }

    // Creator matches
    if (creatorNorm.includes(term)) {
      score += 25;
    }

    // Category matches
    if (normalizeSearchText(pack.category).includes(term)) {
      score += 20;
    }

    // Sticker title and individual tags
    if (stickersTitleNorm.some((st) => st.includes(term))) {
      score += 15;
    }
    if (stickersTagsNorm.some((st) => st.includes(term))) {
      score += 10;
    }

    // Description text
    if (descNorm.includes(term)) {
      score += 8;
    }
  }

  return score;
}

/**
 * Retrieves all active packs: built-in curated catalog + user-published custom packs
 */
export async function getAllExplorePacks(): Promise<ExplorePack[]> {
  try {
    const customPacks = await getCustomPublishedPacks();
    // Custom published packs appear first if recently added, followed by curated packs
    return [...customPacks, ...CURATED_EXPLORE_PACKS];
  } catch (err) {
    console.warn("Could not load custom published packs, returning curated list:", err);
    return CURATED_EXPLORE_PACKS;
  }
}

/**
 * Primary querying helper: filters, searches, sorts, and paginates packs
 */
export async function queryExplorePacks(
  params: ExploreQueryParams = {}
): Promise<ExploreQueryResult> {
  const {
    query = "",
    category = "All",
    mediaType = "all",
    sort = "trending",
    creatorId,
    featuredOnly = false,
    onlyFavorites = false,
    limit = 24,
    offset = 0,
  } = params;

  const [allPacks, favoritedPackIds] = await Promise.all([
    getAllExplorePacks(),
    getAllFavoritePackIds(),
  ]);

  const queryTerms = normalizeSearchText(query)
    .split(/\s+/)
    .filter((t) => t.length > 0);

  // 1. Filter matching items
  const filtered = allPacks.filter((pack) => {
    // Favorites only
    if (onlyFavorites && !favoritedPackIds.includes(pack.id)) {
      return false;
    }

    // Category filter
    if (category && category !== "All" && pack.category !== category) {
      return false;
    }

    // Media type (animated / static)
    if (mediaType === "animated" && !pack.isAnimated) {
      return false;
    }
    if (mediaType === "static" && pack.isAnimated) {
      return false;
    }

    // Creator ID filter
    if (creatorId && pack.creator.id !== creatorId) {
      return false;
    }

    // Featured only
    if (featuredOnly && !pack.isFeatured) {
      return false;
    }

    // Full-text query match
    if (queryTerms.length > 0) {
      const relevance = calculateSearchRelevance(pack, queryTerms);
      if (relevance <= 0) return false;
    }

    return true;
  });

  // 2. Sorting
  const sorted = [...filtered].sort((a, b) => {
    // If a text query is present, order primarily by search relevance score
    if (queryTerms.length > 0) {
      const scoreA = calculateSearchRelevance(a, queryTerms);
      const scoreB = calculateSearchRelevance(b, queryTerms);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }

    switch (sort) {
      case "popular":
        return b.downloadCount - a.downloadCount;
      case "newest": {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      }
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "trending":
      default: {
        // Weighted trending formula: downloads (40%) + likes * 5 (40%) + rating (20%)
        const trendScoreA =
          a.downloadCount + a.likesCount * 5 + (a.rating || 4.5) * 1000;
        const trendScoreB =
          b.downloadCount + b.likesCount * 5 + (b.rating || 4.5) * 1000;
        return trendScoreB - trendScoreA;
      }
    }
  });

  // 3. Category count aggregations across the unfiltered query scope
  const categoryCounts = EXPLORE_CATEGORIES.map((catTag) => {
    const count = allPacks.filter((p) => {
      if (onlyFavorites && !favoritedPackIds.includes(p.id)) return false;
      if (mediaType === "animated" && !p.isAnimated) return false;
      if (mediaType === "static" && p.isAnimated) return false;
      if (queryTerms.length > 0 && calculateSearchRelevance(p, queryTerms) <= 0) return false;
      return p.category === catTag;
    }).length;

    return { tag: catTag, count };
  });

  // 4. Pagination
  const totalCount = sorted.length;
  const paginated = sorted.slice(offset, offset + limit);
  const hasMore = offset + limit < totalCount;

  return {
    packs: paginated,
    totalCount,
    categories: categoryCounts,
    hasMore,
    favoritedPackIds,
  };
}

/**
 * Retrieve a single explore pack by ID
 */
export async function getExplorePackById(id: string): Promise<ExplorePack | null> {
  const allPacks = await getAllExplorePacks();
  return allPacks.find((p) => p.id === id) || null;
}

/**
 * Get related packs based on same category or shared tags
 */
export async function getRelatedExplorePacks(
  targetPack: ExplorePack,
  limit: number = 4
): Promise<ExplorePack[]> {
  const allPacks = await getAllExplorePacks();
  return allPacks
    .filter((p) => p.id !== targetPack.id)
    .map((p) => {
      let similarity = 0;
      if (p.category === targetPack.category) similarity += 10;
      const sharedTags = p.tags.filter((t) => targetPack.tags.includes(t));
      similarity += sharedTags.length * 3;
      return { pack: p, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((item) => item.pack);
}

/**
 * Converts an ExplorePack into a 30-slot Studio StickerPackRecord
 * Enables one-click cloning or customization in the Omoji Sticker Studio
 */
export function convertExplorePackToStudioPack(
  explorePack: ExplorePack,
  newPackId?: string,
  targetAuthorId: string = "local-creator"
): StickerPackRecord {
  const packId =
    newPackId || `studio_pack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const stickers: StickerRecord[] = explorePack.stickers.map((stk, index) => ({
    id: `sticker_${packId}_slot_${index}`,
    packId,
    slotIndex: index,
    imageUrl: stk.imageUrl,
    emojis: stk.emojis.length > 0 ? stk.emojis : ["✨"],
    fileSize: stk.fileSize || 42000,
    isAnimated: Boolean(stk.isAnimated),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    id: packId,
    title: explorePack.title,
    publisher: explorePack.creator.name || "Sticker Studio",
    trayIconUrl: explorePack.trayIconUrl,
    isPublic: false,
    isPublished: false,
    downloadCount: 0,
    authorId: targetAuthorId,
    author: {
      id: targetAuthorId,
      username: explorePack.creator.username || "creator",
      email: `${explorePack.creator.username || "creator"}@omoji.studio`,
    },
    stickers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Publishes a Studio Pack into the local Explore Catalog
 */
export async function publishStudioPackToExplore(
  studioPack: StickerPackRecord,
  category: CategoryTag = "Daily",
  tags: string[] = ["custom", "studio"],
  description: string = ""
): Promise<ExplorePack> {
  const exploreStickers: ExploreSticker[] = (studioPack.stickers || []).map((s, idx) => ({
    id: s.id || `exp_stk_${studioPack.id}_${idx}`,
    packId: studioPack.id,
    imageUrl: s.imageUrl,
    emojis: s.emojis || ["✨"],
    title: `Sticker #${idx + 1}`,
    isAnimated: Boolean(s.isAnimated),
    tags: tags.slice(0, 3),
    dimensions: { width: 512, height: 512 },
    fileSize: s.fileSize || 40000,
    likesCount: 0,
  }));

  const explorePack: ExplorePack = {
    id: studioPack.id,
    title: studioPack.title,
    description: description || `Created with Omoji Sticker Studio by ${studioPack.publisher}`,
    trayIconUrl: studioPack.trayIconUrl,
    category,
    tags: tags.length > 0 ? tags : ["sticker", "whatsapp", category.toLowerCase()],
    creator: {
      id: studioPack.authorId || "local-creator",
      name: studioPack.publisher || "Studio Creator",
      username: studioPack.author?.username || "creator",
      avatarUrl: studioPack.trayIconUrl,
      verified: false,
      bio: "Creator on Omoji Sticker Studio",
    },
    stickers: exploreStickers,
    stickerCount: exploreStickers.length,
    downloadCount: studioPack.downloadCount || 1,
    likesCount: 1,
    rating: 5.0,
    isFeatured: false,
    isTrending: false,
    isAnimated: exploreStickers.some((s) => s.isAnimated),
    isCustomPublished: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await publishCustomPack(explorePack);
  return explorePack;
}
