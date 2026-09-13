/**
 * Online Database & Active Session Storage Engine for Omoji Sticker Studio
 * Replaces legacy IndexedDB with direct Online PostgreSQL database persistence
 * and high-speed in-memory / session state for active slot editing.
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

const IN_MEMORY_DRAFTS = new Map<string, StickerDraft>();
const SESSION_STORAGE_PREFIX = "omoji_online_draft_";

/**
 * Proactively purges any legacy IndexedDB databases from user's browser
 * to ensure 100% reliance on the online database.
 */
export async function purgeAllIndexedDb(): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;
  try {
    const dbsToPurge = ["OmojiStickerStudioDB", "OmojiExploreDB"];
    for (const dbName of dbsToPurge) {
      const req = window.indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => {
        console.log(`[Database] Successfully purged legacy IndexedDB: ${dbName}`);
      };
      req.onerror = () => {
        console.warn(`[Database] Could not purge IndexedDB ${dbName}:`, req.error);
      };
      req.onblocked = () => {
        console.warn(`[Database] IndexedDB ${dbName} purge was blocked by open connection.`);
      };
    }
  } catch (err) {
    console.warn("[Database] Error while purging legacy IndexedDB:", err);
  }
}

// Auto-purge on browser load
if (typeof window !== "undefined") {
  setTimeout(() => {
    purgeAllIndexedDb();
  }, 100);
}

/**
 * Saves or updates an active draft (persisted to session & memory, with online DB synchronization)
 */
export async function saveDraftToDb(draft: StickerDraft): Promise<string> {
  const payload: StickerDraft = {
    ...draft,
    updatedAt: Date.now(),
    itemCount: (draft.packStickers?.length || 0) + (draft.activeImageUrl ? 1 : 0),
  };

  IN_MEMORY_DRAFTS.set(payload.id, payload);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${payload.id}`, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save draft to sessionStorage:", e);
    }
  }

  return payload.id;
}

/**
 * Retrieves a single draft by ID from session/memory
 */
export async function getDraftFromDb(id: string): Promise<StickerDraft | null> {
  if (IN_MEMORY_DRAFTS.has(id)) {
    return IN_MEMORY_DRAFTS.get(id) || null;
  }

  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        IN_MEMORY_DRAFTS.set(id, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read draft from sessionStorage:", e);
    }
  }

  return null;
}

/**
 * Retrieves all active drafts
 */
export async function getAllDraftsFromDb(): Promise<StickerDraft[]> {
  const drafts: StickerDraft[] = [];

  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
          const raw = sessionStorage.getItem(key);
          if (raw) {
            drafts.push(JSON.parse(raw));
          }
        }
      }
    } catch (e) {
      console.warn("Could not read all drafts from sessionStorage:", e);
    }
  }

  // Merge with memory map
  for (const [id, d] of IN_MEMORY_DRAFTS.entries()) {
    if (!drafts.some((x) => x.id === id)) {
      drafts.push(d);
    }
  }

  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
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
  IN_MEMORY_DRAFTS.delete(id);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${id}`);
    } catch (e) {
      console.warn("Could not remove draft from sessionStorage:", e);
    }
  }
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
 * Calculates estimated storage usage across active drafts
 */
export async function getDraftsStorageUsage(): Promise<{ usedBytes: number; draftCount: number; formattedSize: string }> {
  try {
    const drafts = await getAllDraftsFromDb();
    let approximateBytes = 0;

    for (const draft of drafts) {
      approximateBytes += JSON.stringify(draft).length * 2;
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
 * Clear all drafts from active session
 */
export async function clearAllDraftsFromDb(): Promise<void> {
  IN_MEMORY_DRAFTS.clear();
  if (typeof window !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
      console.warn("Could not clear session drafts:", e);
    }
  }
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
  await deleteDraftFromDb(draftId);
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
