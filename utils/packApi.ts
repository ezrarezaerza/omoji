/**
 * Client-side API Service for WhatsApp Sticker Packs & 30-Slot Architecture
 * Unified interface for PostgreSQL backend and Vercel Blob storage.
 */

import {
  StickerPackRecord,
  PacksListResponse,
  PackDetailResponse,
  SlotCommitResponse,
  CreatePackRequest,
  UpdatePackRequest,
  SlotItem,
  PackDetailView,
} from "../src/types/pack";

/**
 * Helper to build headers with active auth token / user identifier if available
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const savedSession = localStorage.getItem("omoji_user_session");
      const savedToken = localStorage.getItem("omoji_user_token") || localStorage.getItem("auth_token");
      let userId = "";

      if (savedSession) {
        const user = JSON.parse(savedSession);
        if (user?.id) userId = user.id;
      }

      if (!userId && savedToken) {
        userId = savedToken;
      }

      // If neither exists, establish or retrieve a stable local guest identifier
      if (!userId) {
        userId = localStorage.getItem("omoji_guest_id") || "";
        if (!userId) {
          userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          localStorage.setItem("omoji_guest_id", userId);
        }
      }

      if (userId) {
        headers["Authorization"] = `Bearer ${userId}`;
        headers["x-user-id"] = userId;
      }
    } catch (e) {
      console.warn("Could not parse auth headers:", e);
    }
  }
  return headers;
}

/**
 * Fetch all sticker packs created by the user or publicly published
 */
export async function fetchPacks(): Promise<StickerPackRecord[]> {
  const res = await fetch("/api/packs", {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch packs (HTTP ${res.status})`);
  }

  const data: PacksListResponse = await res.json();
  return data.packs || [];
}

/**
 * Create a new Sticker Pack
 */
export async function createPack(payload: CreatePackRequest): Promise<StickerPackRecord> {
  let res: Response;

  if (payload.trayIcon && typeof payload.trayIcon !== "string") {
    const formData = new FormData();
    formData.append("title", payload.title.trim());
    formData.append("publisher", payload.publisher.trim());
    formData.append("trayIcon", payload.trayIcon);
    if (payload.trayIconUrl) formData.append("trayIconUrl", payload.trayIconUrl);

    res = await fetch("/api/packs", {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
  } else {
    res = await fetch("/api/packs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title: payload.title.trim(),
        publisher: payload.publisher.trim(),
        trayIconUrl: payload.trayIconUrl,
      }),
    });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create pack (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.pack;
}

/**
 * Fetch a single pack by ID with all stickers
 */
export async function fetchPackDetails(packId: string): Promise<StickerPackRecord> {
  const res = await fetch(`/api/packs/${packId}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch pack details (HTTP ${res.status})`);
  }

  const data: PackDetailResponse = await res.json();
  return data.pack;
}

/**
 * Update Pack metadata (Title, Publisher, Tray Icon, Published state)
 */
export async function updatePack(
  packId: string,
  payload: UpdatePackRequest & { trayIconFile?: File | Blob }
): Promise<StickerPackRecord> {
  let res: Response;

  if (payload.trayIconFile) {
    const formData = new FormData();
    if (payload.title) formData.append("title", payload.title);
    if (payload.publisher) formData.append("publisher", payload.publisher);
    if (payload.trayIconUrl) formData.append("trayIconUrl", payload.trayIconUrl);
    if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
    formData.append("trayIcon", payload.trayIconFile);

    res = await fetch(`/api/packs/${packId}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
  } else {
    res = await fetch(`/api/packs/${packId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update pack (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.pack;
}

/**
 * Delete a pack by ID
 */
export async function deletePack(packId: string): Promise<void> {
  const res = await fetch(`/api/packs/${packId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete pack (HTTP ${res.status})`);
  }
}

/**
 * Commit and save a sticker to a specific slot (0..29) in the pack
 */
export async function saveStickerToSlot(
  packId: string,
  slotIndex: number,
  options: {
    stickerBlob?: Blob | File;
    imageUrl?: string;
    emojis?: string[];
    isAnimated?: boolean;
  }
): Promise<SlotCommitResponse> {
  let res: Response;

  if (options.stickerBlob) {
    const formData = new FormData();
    formData.append("sticker", options.stickerBlob);
    formData.append("emojis", JSON.stringify(options.emojis || ["✨"]));
    formData.append("isAnimated", String(Boolean(options.isAnimated)));

    res = await fetch(`/api/packs/${packId}/stickers/${slotIndex}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
  } else {
    res = await fetch(`/api/packs/${packId}/stickers/${slotIndex}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        imageUrl: options.imageUrl,
        emojis: options.emojis || ["✨"],
        isAnimated: Boolean(options.isAnimated),
      }),
    });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save sticker to slot ${slotIndex + 1} (HTTP ${res.status})`);
  }

  return await res.json();
}

/**
 * Clear a sticker from a slot
 */
export async function clearStickerSlot(
  packId: string,
  slotIndex: number
): Promise<StickerPackRecord> {
  const res = await fetch(`/api/packs/${packId}/stickers/${slotIndex}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to clear slot ${slotIndex + 1} (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.pack;
}

/**
 * Aliases for convenient component usage
 */
export const getPackById = fetchPackDetails;

export async function updatePackMetadata(
  packId: string,
  data: { title?: string; publisher?: string; trayIconUrl?: string }
): Promise<{ pack: StickerPackRecord }> {
  const pack = await updatePack(packId, data);
  return { pack };
}

export async function deleteStickerFromSlot(
  packId: string,
  slotIndex: number
): Promise<{ pack: StickerPackRecord }> {
  const pack = await clearStickerSlot(packId, slotIndex);
  return { pack };
}

/**
 * Transforms a raw Pack Record into a full 30-slot Grid View representation
 */
export function build30SlotGrid(pack: StickerPackRecord): PackDetailView {
  const slots: SlotItem[] = Array.from({ length: 30 }, (_, index) => {
    const foundSticker = pack.stickers?.find((s) => s.slotIndex === index) || null;
    return {
      slotIndex: index,
      sticker: foundSticker,
      hasDraft: false,
    };
  });

  const totalOccupied = slots.filter((s) => s.sticker !== null).length;

  return {
    pack,
    slots,
    totalOccupied,
    totalDrafts: 0,
    isReadyForWhatsApp: totalOccupied >= 3,
  };
}
