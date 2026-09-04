/**
 * Cloud Synchronization & Backup Engine for Omoji Sticker Studio
 * Manages 2-way synchronization between IndexedDB local storage and PostgreSQL / Vercel Blob cloud database.
 */

import {
  StickerDraft,
  getAllDraftsFromDb,
  saveDraftToDb,
  getDraftFromDb,
  deleteDraftFromDb,
} from "./draftsDb";
import { createTrayIcon, dataUrlToBlob } from "./exportSticker";

export interface CloudSyncResult {
  syncedCount: number;
  pulledCount: number;
  failedCount: number;
  errors: string[];
}

export interface CloudPackItem {
  id: string;
  title: string;
  publisher?: string;
  trayIconUrl: string;
  isPublic: boolean;
  isPublished: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    email: string;
  };
  stickers: Array<{
    id: string;
    imageUrl: string;
    order: number;
    emojis?: string[];
  }>;
}

/**
 * Uploads a single local draft to the cloud backend
 */
export async function syncSingleDraftToCloud(
  draft: StickerDraft,
  userId?: string | null,
  onProgress?: (step: string) => void
): Promise<{ success: boolean; cloudPack?: any; error?: string }> {
  try {
    if (onProgress) onProgress("Preparing sticker assets...");

    // Gather all stickers in this draft
    const stickersList: (Blob | string)[] = [];
    if (draft.packStickers && draft.packStickers.length > 0) {
      stickersList.push(...draft.packStickers);
    }
    if (draft.activeImageUrl && !stickersList.includes(draft.activeImageUrl)) {
      stickersList.unshift(draft.activeImageUrl);
    }

    if (stickersList.length === 0 && draft.thumbnail) {
      stickersList.push(draft.thumbnail);
    }

    if (stickersList.length === 0) {
      return { success: false, error: "No sticker images to synchronize." };
    }

    if (onProgress) onProgress("Generating tray icon...");
    const traySource = draft.thumbnail || stickersList[0];
    const trayBlob = await createTrayIcon(traySource, 96);

    const formData = new FormData();
    formData.append("packTitle", draft.title || draft.packName || "Untitled Pack");
    formData.append("authorName", draft.author || "Sticker Creator");
    formData.append("trayIcon", trayBlob, "tray_icon.png");

    if (onProgress) onProgress(`Converting ${stickersList.length} stickers to WebP...`);
    for (let i = 0; i < stickersList.length; i++) {
      const item = stickersList[i];
      const blob = typeof item === "string" ? dataUrlToBlob(item) : item;
      formData.append("stickers", blob, `sticker_${i + 1}.webp`);
    }

    if (onProgress) onProgress("Syncing with Cloud DB...");

    const headers: Record<string, string> = {};
    if (userId) {
      headers["x-user-id"] = userId;
      headers["Authorization"] = `Bearer ${userId}`;
    }

    const response = await fetch("/api/packs", {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to sync pack to cloud.");
    }

    // Update local draft with sync status
    const updatedDraft: StickerDraft = {
      ...draft,
      isSynced: true,
      cloudPackId: data.pack?.id,
      lastSyncedAt: Date.now(),
    };
    await saveDraftToDb(updatedDraft);

    return { success: true, cloudPack: data.pack };
  } catch (err: any) {
    console.error("Cloud sync draft error:", err);
    return { success: false, error: err?.message || "Cloud sync failed" };
  }
}

/**
 * Fetches all published packs from the cloud API
 */
export async function fetchCloudPacks(userId?: string | null): Promise<CloudPackItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (userId) {
      headers["x-user-id"] = userId;
      headers["Authorization"] = `Bearer ${userId}`;
    }

    const response = await fetch("/api/packs", { headers });
    if (!response.ok) return [];

    const data = await response.json();
    return data.packs || [];
  } catch (err) {
    console.warn("Could not fetch cloud packs:", err);
    return [];
  }
}

/**
 * Pulls cloud packs and creates local IndexedDB drafts if not already present
 */
export async function pullCloudPacksToLocal(userId?: string | null): Promise<number> {
  try {
    const cloudPacks = await fetchCloudPacks(userId);
    const localDrafts = await getAllDraftsFromDb();
    const existingCloudIds = new Set(localDrafts.map((d) => d.cloudPackId).filter(Boolean));

    let importedCount = 0;
    for (const cp of cloudPacks) {
      // If we don't have this cloud pack locally
      if (!existingCloudIds.has(cp.id)) {
        const stickerUrls = (cp.stickers || []).map((s) => s.imageUrl);
        const newDraft: StickerDraft = {
          id: `cloud_import_${cp.id}`,
          title: cp.title,
          author: cp.publisher || cp.author?.username || "Creator",
          packName: cp.title,
          thumbnail: cp.trayIconUrl || stickerUrls[0] || "",
          originalImageUrl: stickerUrls[0] || null,
          activeImageUrl: stickerUrls[0] || null,
          textElements: [],
          lines: [],
          outlineConfig: {
            color: "#ffffff",
            width: 8,
            enabled: true,
            feather: 0,
            opacity: 1,
            style: "solid",
          },
          filterConfig: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            warmth: 0,
            sharpen: 0,
            vignette: 0,
            preset: "original",
          },
          layerStates: {},
          layerOrder: [],
          packStickers: stickerUrls,
          createdAt: new Date(cp.createdAt).getTime(),
          updatedAt: new Date(cp.updatedAt || cp.createdAt).getTime(),
          itemCount: stickerUrls.length,
          isSynced: true,
          cloudPackId: cp.id,
          lastSyncedAt: Date.now(),
        };

        await saveDraftToDb(newDraft);
        importedCount++;
      }
    }

    return importedCount;
  } catch (err) {
    console.error("Failed to pull cloud packs:", err);
    return 0;
  }
}

/**
 * Two-way sync: Pushes unsynced drafts and pulls new cloud packs
 */
export async function performTwoWayCloudSync(
  userId?: string | null,
  onProgress?: (status: string) => void
): Promise<CloudSyncResult> {
  const result: CloudSyncResult = {
    syncedCount: 0,
    pulledCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    if (onProgress) onProgress("Checking local drafts...");
    const localDrafts = await getAllDraftsFromDb();

    // 1. Push unsynced local drafts
    for (const draft of localDrafts) {
      if (!draft.isSynced && (draft.activeImageUrl || (draft.packStickers && draft.packStickers.length > 0))) {
        if (onProgress) onProgress(`Uploading pack "${draft.title || draft.packName}"...`);
        const syncRes = await syncSingleDraftToCloud(draft, userId);
        if (syncRes.success) {
          result.syncedCount++;
        } else {
          result.failedCount++;
          if (syncRes.error) result.errors.push(syncRes.error);
        }
      }
    }

    // 2. Pull remote packs
    if (onProgress) onProgress("Checking for remote packs on Cloud...");
    const pulled = await pullCloudPacksToLocal(userId);
    result.pulledCount = pulled;

    if (onProgress) onProgress("Cloud synchronization complete!");
  } catch (err: any) {
    result.errors.push(err?.message || "Sync encountered an issue");
  }

  return result;
}

/**
 * Deletes a pack from the cloud database
 */
export async function deleteCloudPack(packId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/packs?id=${encodeURIComponent(packId)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete cloud pack:", err);
    return false;
  }
}
