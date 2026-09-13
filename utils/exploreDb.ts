/**
 * Persistence Layer for Explore Feed
 * Direct Local Storage persistence (IndexedDB completely deprecated & purged)
 * Handles user bookmarks/favorites and published custom packs with instant responsiveness.
 */

import { ExplorePack, ExploreSticker } from "../src/types/explore";

const LS_KEY_FAV_PACKS = "omoji_explore_fav_packs";
const LS_KEY_FAV_STICKERS = "omoji_explore_fav_stickers";
const LS_KEY_FAV_STICKER_RECORDS = "omoji_explore_fav_sticker_records";
const LS_KEY_CUSTOM_PACKS = "omoji_explore_custom_published_packs";
const LS_KEY_CREATOR_FOLLOWS = "omoji_explore_creator_follows";

// -------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -------------------------------------------------------------

function getLsArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLsArray(key: string, arr: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}

// -------------------------------------------------------------
// FAVORITE PACKS (BOOKMARKS)
// -------------------------------------------------------------

export interface FavoritedPackRecord {
  id: string; // packId
  savedAt: number;
}

/**
 * Get all favorited pack IDs
 */
export async function getAllFavoritePackIds(): Promise<string[]> {
  return getLsArray(LS_KEY_FAV_PACKS);
}

/**
 * Check if a pack is favorited
 */
export async function isPackFavorited(packId: string): Promise<boolean> {
  const allFavs = await getAllFavoritePackIds();
  return allFavs.includes(packId);
}

/**
 * Toggle favorite status of a pack
 */
export async function toggleFavoritePack(packId: string): Promise<boolean> {
  const currentFavs = await getAllFavoritePackIds();
  const willBeFavorited = !currentFavs.includes(packId);

  const updatedList = willBeFavorited
    ? [...currentFavs, packId]
    : currentFavs.filter((id) => id !== packId);
  setLsArray(LS_KEY_FAV_PACKS, updatedList);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:favorites_changed", {
        detail: { type: "pack", id: packId, isFavorited: willBeFavorited },
      })
    );
  }

  return willBeFavorited;
}

// -------------------------------------------------------------
// FAVORITE STICKERS
// -------------------------------------------------------------

export interface FavoritedStickerRecord {
  id: string; // stickerId
  packId?: string;
  packTitle?: string;
  savedAt: number;
  sticker?: ExploreSticker;
}

function getLsStickerRecords(): FavoritedStickerRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY_FAV_STICKER_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLsStickerRecords(records: FavoritedStickerRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY_FAV_STICKER_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.warn("localStorage write sticker records failed:", e);
  }
}

/**
 * Get all favorited sticker IDs
 */
export async function getAllFavoriteStickerIds(): Promise<string[]> {
  return getLsArray(LS_KEY_FAV_STICKERS);
}

/**
 * Get all favorited sticker records (including sticker metadata)
 */
export async function getAllFavoriteStickers(): Promise<FavoritedStickerRecord[]> {
  const records = getLsStickerRecords();
  return records.sort((a, b) => b.savedAt - a.savedAt);
}

export const getAllFavoriteStickerRecords = getAllFavoriteStickers;

/**
 * Check if a specific sticker is favorited
 */
export async function isStickerFavorited(stickerId: string): Promise<boolean> {
  const allFavs = await getAllFavoriteStickerIds();
  return allFavs.includes(stickerId);
}

/**
 * Toggle favorite status of a sticker
 */
export async function toggleFavoriteSticker(
  stickerId: string,
  packIdOrData?: string | { packId?: string; packTitle?: string; sticker?: ExploreSticker },
  stickerArg?: ExploreSticker,
  packTitleArg?: string
): Promise<boolean> {
  const stickerData: { packId?: string; packTitle?: string; sticker?: ExploreSticker } =
    typeof packIdOrData === "string"
      ? { packId: packIdOrData, sticker: stickerArg, packTitle: packTitleArg }
      : packIdOrData || {};

  const currentFavs = await getAllFavoriteStickerIds();
  const willBeFavorited = !currentFavs.includes(stickerId);

  const updatedIds = willBeFavorited
    ? [...currentFavs, stickerId]
    : currentFavs.filter((id) => id !== stickerId);
  setLsArray(LS_KEY_FAV_STICKERS, updatedIds);

  const records = getLsStickerRecords();
  const updatedRecords = willBeFavorited
    ? [
        {
          id: stickerId,
          packId: stickerData?.packId,
          packTitle: stickerData?.packTitle,
          savedAt: Date.now(),
          sticker: stickerData?.sticker,
        },
        ...records.filter((r) => r.id !== stickerId),
      ]
    : records.filter((r) => r.id !== stickerId);
  setLsStickerRecords(updatedRecords);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:favorites_changed", {
        detail: { type: "sticker", id: stickerId, isFavorited: willBeFavorited },
      })
    );
  }

  return willBeFavorited;
}

/**
 * Batch remove multiple stickers from favorites
 */
export async function batchRemoveFavoriteStickers(stickerIds: string[]): Promise<void> {
  const currentFavs = await getAllFavoriteStickerIds();
  const updatedIds = currentFavs.filter((id) => !stickerIds.includes(id));
  setLsArray(LS_KEY_FAV_STICKERS, updatedIds);

  const records = getLsStickerRecords();
  const updatedRecords = records.filter((r) => !stickerIds.includes(r.id));
  setLsStickerRecords(updatedRecords);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:favorites_changed", {
        detail: { type: "batch_sticker_remove", ids: stickerIds },
      })
    );
  }
}

// -------------------------------------------------------------
// CUSTOM PUBLISHED PACKS
// -------------------------------------------------------------

function getLsCustomPacks(): ExplorePack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY_CUSTOM_PACKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLsCustomPacks(packs: ExplorePack[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY_CUSTOM_PACKS, JSON.stringify(packs));
  } catch (e) {
    console.warn("localStorage write custom packs failed:", e);
  }
}

/**
 * Get all custom published packs
 */
export async function getCustomPublishedPacks(): Promise<ExplorePack[]> {
  const packs = getLsCustomPacks();
  return packs.sort((a, b) => {
    const timeA = typeof a.updatedAt === "number" ? a.updatedAt : typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0;
    const timeB = typeof b.updatedAt === "number" ? b.updatedAt : typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Publish a pack to the local Explore feed
 */
export async function publishCustomPack(pack: ExplorePack): Promise<void> {
  const publishedPack: ExplorePack = {
    ...pack,
    isCustomPublished: true,
    updatedAt: Date.now(),
  };

  const existingLs = getLsCustomPacks().filter((p) => p.id !== pack.id);
  setLsCustomPacks([publishedPack, ...existingLs]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:catalog_updated", {
        detail: { packId: pack.id, action: "published" },
      })
    );
  }
}

/**
 * Remove a custom published pack
 */
export async function deleteCustomPublishedPack(packId: string): Promise<void> {
  const existingLs = getLsCustomPacks().filter((p) => p.id !== packId);
  setLsCustomPacks(existingLs);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:catalog_updated", {
        detail: { packId, action: "deleted" },
      })
    );
  }
}

// -------------------------------------------------------------
// CREATOR FOLLOWS SYSTEM
// -------------------------------------------------------------

export async function getAllFollowedCreatorUsernames(): Promise<string[]> {
  return getLsArray(LS_KEY_CREATOR_FOLLOWS);
}

export async function isCreatorFollowed(username: string): Promise<boolean> {
  if (!username) return false;
  const followed = await getAllFollowedCreatorUsernames();
  return followed.includes(username.toLowerCase());
}

export async function toggleFollowCreator(username: string): Promise<boolean> {
  if (!username) return false;
  const cleanUsername = username.toLowerCase().trim();
  const currentFollowed = await getAllFollowedCreatorUsernames();
  const willFollow = !currentFollowed.includes(cleanUsername);

  const updated = willFollow
    ? [...currentFollowed, cleanUsername]
    : currentFollowed.filter((u) => u !== cleanUsername);

  setLsArray(LS_KEY_CREATOR_FOLLOWS, updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:creator_followed", {
        detail: { username: cleanUsername, isFollowing: willFollow },
      })
    );
  }

  return willFollow;
}
