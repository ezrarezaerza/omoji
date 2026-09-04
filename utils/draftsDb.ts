/**
 * IndexedDB Local Storage & Project Snapshots Engine for Omoji Sticker Studio
 * High-performance, offline-first persistence for sticker layers, cutouts, text, and pack collections.
 */

export interface ImageTransformMatrix {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface StickerDraft {
  id: string;
  title: string;
  author: string;
  packName: string;
  thumbnail: string; // Base64 / DataURL visual preview of canvas
  originalImageUrl: string | null;
  activeImageUrl: string | null;
  imageTransform?: ImageTransformMatrix | null;
  textElements: any[];
  lines: any[];
  outlineConfig: any;
  filterConfig: any;
  layerStates: Record<string, any>;
  layerOrder: string[];
  packStickers: string[];
  createdAt: number;
  updatedAt: number;
  isAnimated?: boolean;
  itemCount: number;
  isSynced?: boolean;
  cloudPackId?: string;
  slotIndex?: number;
  lastSyncedAt?: number;
}

const DB_NAME = "OmojiStickerStudioDB";
const DB_VERSION = 1;
const STORE_DRAFTS = "drafts";
const STORE_PACKS = "offline_packs";

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and upgrades the IndexedDB database
 */
export function openDraftsDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Drafts Store
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        const draftStore = db.createObjectStore(STORE_DRAFTS, { keyPath: "id" });
        draftStore.createIndex("updatedAt", "updatedAt", { unique: false });
        draftStore.createIndex("packName", "packName", { unique: false });
      }

      // Offline Packs Store
      if (!db.objectStoreNames.contains(STORE_PACKS)) {
        const packStore = db.createObjectStore(STORE_PACKS, { keyPath: "id" });
        packStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };
  });
}

/**
 * Saves or updates a draft snapshot
 */
export async function saveDraftToDb(draft: StickerDraft): Promise<string> {
  const db = await openDraftsDb();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_DRAFTS], "readwrite");
      const store = transaction.objectStore(STORE_DRAFTS);
      
      const payload: StickerDraft = {
        ...draft,
        updatedAt: Date.now(),
        itemCount: (draft.packStickers?.length || 0) + (draft.activeImageUrl ? 1 : 0),
      };

      const request = store.put(payload);

      request.onsuccess = () => {
        resolve(payload.id);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieves a single draft by ID
 */
export async function getDraftFromDb(id: string): Promise<StickerDraft | null> {
  const db = await openDraftsDb();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_DRAFTS], "readonly");
      const store = transaction.objectStore(STORE_DRAFTS);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieves all saved drafts sorted by most recently updated
 */
export async function getAllDraftsFromDb(): Promise<StickerDraft[]> {
  const db = await openDraftsDb();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_DRAFTS], "readonly");
      const store = transaction.objectStore(STORE_DRAFTS);
      const index = store.index("updatedAt");
      const request = index.openCursor(null, "prev"); // newest first
      const drafts: StickerDraft[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          drafts.push(cursor.value);
          cursor.continue();
        } else {
          resolve(drafts);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieves the most recent draft
 */
export async function getLatestDraftFromDb(): Promise<StickerDraft | null> {
  const drafts = await getAllDraftsFromDb();
  return drafts.length > 0 ? drafts[0] : null;
}

/**
 * Deletes a draft by ID
 */
export async function deleteDraftFromDb(id: string): Promise<void> {
  const db = await openDraftsDb();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_DRAFTS], "readwrite");
      const store = transaction.objectStore(STORE_DRAFTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Duplicates an existing draft
 */
export async function duplicateDraftInDb(id: string): Promise<StickerDraft> {
  const source = await getDraftFromDb(id);
  if (!source) {
    throw new Error("Draft not found to duplicate");
  }

  const newDraft: StickerDraft = {
    ...source,
    id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${source.title || source.packName || "Draft"} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveDraftToDb(newDraft);
  return newDraft;
}

/**
 * Calculates estimated local storage usage across drafts
 */
export async function getDraftsStorageUsage(): Promise<{ usedBytes: number; draftCount: number; formattedSize: string }> {
  try {
    const drafts = await getAllDraftsFromDb();
    let approximateBytes = 0;
    
    for (const draft of drafts) {
      approximateBytes += JSON.stringify(draft).length * 2; // rough UTF-16 byte estimation
    }

    const formattedSize = formatStorageBytes(approximateBytes);
    return {
      usedBytes: approximateBytes,
      draftCount: drafts.length,
      formattedSize,
    };
  } catch {
    return { usedBytes: 0, draftCount: 0, formattedSize: "0 KB" };
  }
}

/**
 * Clear all drafts
 */
export async function clearAllDraftsFromDb(): Promise<void> {
  const db = await openDraftsDb();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_DRAFTS], "readwrite");
      const store = transaction.objectStore(STORE_DRAFTS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function formatStorageBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Deterministic ID for a draft assigned to a specific pack slot (0..29)
 */
export function getSlotDraftId(packId: string, slotIndex: number): string {
  return `draft_pack_${packId}_slot_${slotIndex}`;
}

/**
 * Save or update a draft specifically bound to a pack slot
 */
export async function saveSlotDraft(
  packId: string,
  slotIndex: number,
  draftData: Partial<StickerDraft>
): Promise<StickerDraft> {
  const draftId = getSlotDraftId(packId, slotIndex);
  const existing = (await getDraftFromDb(draftId)) || {};

  const fullDraft: StickerDraft = {
    id: draftId,
    cloudPackId: packId,
    slotIndex,
    title: draftData.title || `Slot #${slotIndex + 1} Draft`,
    author: draftData.author || "Sticker Creator",
    packName: draftData.packName || "Pack Sticker",
    thumbnail: draftData.thumbnail || draftData.activeImageUrl || "",
    originalImageUrl: draftData.originalImageUrl || null,
    activeImageUrl: draftData.activeImageUrl || null,
    textElements: draftData.textElements || [],
    lines: draftData.lines || [],
    outlineConfig: draftData.outlineConfig || {},
    filterConfig: draftData.filterConfig || {},
    layerStates: draftData.layerStates || {},
    layerOrder: draftData.layerOrder || [],
    packStickers: draftData.packStickers || [],
    createdAt: (existing as any).createdAt || Date.now(),
    updatedAt: Date.now(),
    isAnimated: Boolean(draftData.isAnimated),
    itemCount: 1,
    ...draftData,
  };

  await saveDraftToDb(fullDraft);
  return fullDraft;
}

/**
 * Retrieve a slot draft by packId and slotIndex
 */
export async function getSlotDraft(
  packId: string,
  slotIndex: number
): Promise<StickerDraft | null> {
  const draftId = getSlotDraftId(packId, slotIndex);
  return await getDraftFromDb(draftId);
}

/**
 * Delete a slot draft by packId and slotIndex
 */
export async function deleteSlotDraft(
  packId: string,
  slotIndex: number
): Promise<void> {
  const draftId = getSlotDraftId(packId, slotIndex);
  return await deleteDraftFromDb(draftId);
}

/**
 * Get all active drafts associated with a specific pack's 30 slots
 */
export async function getAllSlotDraftsForPack(
  packId: string
): Promise<Record<number, StickerDraft>> {
  const allDrafts = await getAllDraftsFromDb();
  const prefix = `draft_pack_${packId}_slot_`;
  const result: Record<number, StickerDraft> = {};

  for (const draft of allDrafts) {
    if (draft.cloudPackId === packId || draft.id.startsWith(prefix)) {
      const idx =
        typeof draft.slotIndex === "number"
          ? draft.slotIndex
          : parseInt(draft.id.replace(prefix, ""), 10);
      if (!isNaN(idx) && idx >= 0 && idx < 30) {
        result[idx] = draft;
      }
    }
  }

  return result;
}

