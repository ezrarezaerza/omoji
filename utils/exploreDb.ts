/**
 * IndexedDB Persistence Layer for Explore Feed
 * Handles user bookmarks/favorites and locally published custom packs with localStorage fallback.
 */

import { ExplorePack } from "../src/types/explore";

const EXPLORE_DB_NAME = "OmojiExploreDB";
const EXPLORE_DB_VERSION = 2;

const STORE_FAVORITE_PACKS = "favorite_packs";
const STORE_FAVORITE_STICKERS = "favorite_stickers";
const STORE_CUSTOM_PACKS = "custom_published_packs";
const STORE_CREATOR_FOLLOWS = "creator_follows";

const LS_KEY_FAV_PACKS = "omoji_explore_fav_packs";
const LS_KEY_FAV_STICKERS = "omoji_explore_fav_stickers";
const LS_KEY_CUSTOM_PACKS = "omoji_explore_custom_published_packs";
const LS_KEY_CREATOR_FOLLOWS = "omoji_explore_creator_follows";

let exploreDbInstance: IDBDatabase | null = null;

/**
 * Opens or initializes the Explore IndexedDB instance
 */
export function openExploreDb(): Promise<IDBDatabase> {
  if (exploreDbInstance) {
    return Promise.resolve(exploreDbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available in this environment."));
      return;
    }

    const request = indexedDB.open(EXPLORE_DB_NAME, EXPLORE_DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Favorite Packs Store
      if (!db.objectStoreNames.contains(STORE_FAVORITE_PACKS)) {
        const favPackStore = db.createObjectStore(STORE_FAVORITE_PACKS, {
          keyPath: "id",
        });
        favPackStore.createIndex("savedAt", "savedAt", { unique: false });
      }

      // Favorite Stickers Store
      if (!db.objectStoreNames.contains(STORE_FAVORITE_STICKERS)) {
        const favStickerStore = db.createObjectStore(STORE_FAVORITE_STICKERS, {
          keyPath: "id",
        });
        favStickerStore.createIndex("packId", "packId", { unique: false });
        favStickerStore.createIndex("savedAt", "savedAt", { unique: false });
      }

      // Custom Published Packs Store
      if (!db.objectStoreNames.contains(STORE_CUSTOM_PACKS)) {
        const customStore = db.createObjectStore(STORE_CUSTOM_PACKS, {
          keyPath: "id",
        });
        customStore.createIndex("category", "category", { unique: false });
        customStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Creator Follows Store
      if (!db.objectStoreNames.contains(STORE_CREATOR_FOLLOWS)) {
        const followStore = db.createObjectStore(STORE_CREATOR_FOLLOWS, {
          keyPath: "username",
        });
        followStore.createIndex("followedAt", "followedAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      exploreDbInstance = request.result;
      resolve(exploreDbInstance);
    };

    request.onerror = () => {
      console.warn("Could not open Explore IndexedDB, will use localStorage fallback:", request.error);
      reject(request.error);
    };
  });
}

// -------------------------------------------------------------
// LOCAL STORAGE FALLBACK HELPERS
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
  try {
    const db = await openExploreDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_FAVORITE_PACKS], "readonly");
      const store = transaction.objectStore(STORE_FAVORITE_PACKS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: FavoritedPackRecord[] = request.result || [];
        resolve(records.map((r) => r.id));
      };
      request.onerror = () => {
        resolve(getLsArray(LS_KEY_FAV_PACKS));
      };
    });
  } catch {
    return getLsArray(LS_KEY_FAV_PACKS);
  }
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
 * Returns new favorited state (true if favorited, false if removed)
 */
export async function toggleFavoritePack(packId: string): Promise<boolean> {
  const currentFavs = await getAllFavoritePackIds();
  const willBeFavorited = !currentFavs.includes(packId);

  // Update localStorage cache first
  const updatedList = willBeFavorited
    ? [...currentFavs, packId]
    : currentFavs.filter((id) => id !== packId);
  setLsArray(LS_KEY_FAV_PACKS, updatedList);

  try {
    const db = await openExploreDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_FAVORITE_PACKS], "readwrite");
      const store = transaction.objectStore(STORE_FAVORITE_PACKS);

      if (willBeFavorited) {
        const record: FavoritedPackRecord = { id: packId, savedAt: Date.now() };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } else {
        const req = store.delete(packId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.warn("IndexedDB toggleFavoritePack fallback applied:", err);
  }

  // Dispatch custom browser event so any active explore listeners update immediately
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
  sticker?: import("../src/types/explore").ExploreSticker;
}

const LS_KEY_FAV_STICKER_RECORDS = "omoji_explore_fav_sticker_records";

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
    console.warn("localStorage write failed:", e);
  }
}

export async function getAllFavoriteStickerIds(): Promise<string[]> {
  try {
    const records = await getAllFavoriteStickerRecords();
    return records.map((r) => r.id);
  } catch {
    return getLsArray(LS_KEY_FAV_STICKERS);
  }
}

export async function getAllFavoriteStickerRecords(): Promise<FavoritedStickerRecord[]> {
  try {
    const db = await openExploreDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_FAVORITE_STICKERS], "readonly");
      const store = transaction.objectStore(STORE_FAVORITE_STICKERS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: FavoritedStickerRecord[] = request.result || [];
        if (records.length === 0) {
          const ls = getLsStickerRecords();
          resolve(ls);
        } else {
          // Keep LS in sync
          setLsStickerRecords(records);
          resolve(records.sort((a, b) => b.savedAt - a.savedAt));
        }
      };
      request.onerror = () => {
        resolve(getLsStickerRecords());
      };
    });
  } catch {
    return getLsStickerRecords();
  }
}

export async function isStickerFavorited(stickerId: string): Promise<boolean> {
  const ids = await getAllFavoriteStickerIds();
  return ids.includes(stickerId);
}

export async function toggleFavoriteSticker(
  stickerId: string,
  packId?: string,
  stickerData?: import("../src/types/explore").ExploreSticker,
  packTitle?: string
): Promise<boolean> {
  const currentRecords = await getAllFavoriteStickerRecords();
  const existingIdx = currentRecords.findIndex((r) => r.id === stickerId);
  const willBeFavorited = existingIdx === -1;

  let updatedRecords: FavoritedStickerRecord[];
  if (willBeFavorited) {
    const newRecord: FavoritedStickerRecord = {
      id: stickerId,
      packId,
      packTitle,
      savedAt: Date.now(),
      sticker: stickerData,
    };
    updatedRecords = [newRecord, ...currentRecords];
  } else {
    updatedRecords = currentRecords.filter((r) => r.id !== stickerId);
  }

  setLsStickerRecords(updatedRecords);
  setLsArray(LS_KEY_FAV_STICKERS, updatedRecords.map((r) => r.id));

  try {
    const db = await openExploreDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_FAVORITE_STICKERS], "readwrite");
      const store = transaction.objectStore(STORE_FAVORITE_STICKERS);

      if (willBeFavorited) {
        const req = store.put({
          id: stickerId,
          packId,
          packTitle,
          savedAt: Date.now(),
          sticker: stickerData,
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } else {
        const req = store.delete(stickerId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.warn("IndexedDB toggleFavoriteSticker fallback applied:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:favorites_changed", {
        detail: { type: "sticker", id: stickerId, isFavorited: willBeFavorited },
      })
    );
  }

  return willBeFavorited;
}

export async function batchRemoveFavoriteStickers(stickerIds: string[]): Promise<void> {
  const currentRecords = await getAllFavoriteStickerRecords();
  const remaining = currentRecords.filter((r) => !stickerIds.includes(r.id));

  setLsStickerRecords(remaining);
  setLsArray(LS_KEY_FAV_STICKERS, remaining.map((r) => r.id));

  try {
    const db = await openExploreDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_FAVORITE_STICKERS], "readwrite");
      const store = transaction.objectStore(STORE_FAVORITE_STICKERS);

      let completed = 0;
      if (stickerIds.length === 0) return resolve();

      stickerIds.forEach((id) => {
        const req = store.delete(id);
        req.onsuccess = () => {
          completed++;
          if (completed === stickerIds.length) resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  } catch (err) {
    console.warn("IndexedDB batchRemoveFavoriteStickers error:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:favorites_changed", {
        detail: { type: "batch_remove", ids: stickerIds },
      })
    );
  }
}

// -------------------------------------------------------------
// CUSTOM PUBLISHED PACKS
// -------------------------------------------------------------

/**
 * Retrieve all custom published packs created by local users
 */
export async function getCustomPublishedPacks(): Promise<ExplorePack[]> {
  try {
    const db = await openExploreDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_CUSTOM_PACKS], "readonly");
      const store = transaction.objectStore(STORE_CUSTOM_PACKS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        resolve(getLsCustomPacks());
      };
    });
  } catch {
    return getLsCustomPacks();
  }
}

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
 * Publish a pack to the local Explore feed
 */
export async function publishCustomPack(pack: ExplorePack): Promise<void> {
  const publishedPack: ExplorePack = {
    ...pack,
    isCustomPublished: true,
    updatedAt: Date.now(),
  };

  // Sync to LS
  const existingLs = getLsCustomPacks().filter((p) => p.id !== pack.id);
  setLsCustomPacks([publishedPack, ...existingLs]);

  try {
    const db = await openExploreDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_CUSTOM_PACKS], "readwrite");
      const store = transaction.objectStore(STORE_CUSTOM_PACKS);
      const req = store.put(publishedPack);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB publishCustomPack fallback applied:", err);
  }

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

  try {
    const db = await openExploreDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_CUSTOM_PACKS], "readwrite");
      const store = transaction.objectStore(STORE_CUSTOM_PACKS);
      const req = store.delete(packId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteCustomPublishedPack error:", err);
  }

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

export interface CreatorFollowDbRecord {
  username: string;
  followedAt: number;
}

export async function getAllFollowedCreatorUsernames(): Promise<string[]> {
  try {
    const db = await openExploreDb();
    return new Promise((resolve) => {
      if (!db.objectStoreNames.contains(STORE_CREATOR_FOLLOWS)) {
        resolve(getLsArray(LS_KEY_CREATOR_FOLLOWS));
        return;
      }
      const transaction = db.transaction([STORE_CREATOR_FOLLOWS], "readonly");
      const store = transaction.objectStore(STORE_CREATOR_FOLLOWS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: CreatorFollowDbRecord[] = request.result || [];
        const usernames = records.map((r) => r.username.toLowerCase());
        setLsArray(LS_KEY_CREATOR_FOLLOWS, usernames);
        resolve(usernames);
      };
      request.onerror = () => {
        resolve(getLsArray(LS_KEY_CREATOR_FOLLOWS));
      };
    });
  } catch {
    return getLsArray(LS_KEY_CREATOR_FOLLOWS);
  }
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

  try {
    const db = await openExploreDb();
    if (db.objectStoreNames.contains(STORE_CREATOR_FOLLOWS)) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_CREATOR_FOLLOWS], "readwrite");
        const store = transaction.objectStore(STORE_CREATOR_FOLLOWS);

        if (willFollow) {
          const req = store.put({
            username: cleanUsername,
            followedAt: Date.now(),
          });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } else {
          const req = store.delete(cleanUsername);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }
      });
    }
  } catch (err) {
    console.warn("IndexedDB toggleFollowCreator fallback applied:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omoji:creator_followed", {
        detail: { username: cleanUsername, isFollowing: willFollow },
      })
    );
  }

  return willFollow;
}

