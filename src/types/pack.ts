/**
 * Core Data Models & Type Definitions for WhatsApp Sticker Studio
 * 30-Slot Pack Architecture & Persistence Types
 */

export interface StickerRecord {
  id: string;
  packId: string;
  slotIndex: number; // 0..29
  imageUrl: string;
  emojis: string[];
  fileSize?: number;
  isAnimated: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface StickerPackAuthor {
  id: string;
  username: string;
  email: string;
}

export interface StickerPackRecord {
  id: string;
  title: string; // Pack Name
  publisher: string; // Creator Name
  trayIconUrl: string; // 96x96 Tray Icon
  isPublic: boolean;
  isPublished: boolean;
  downloadCount: number;
  authorId: string;
  author?: StickerPackAuthor;
  stickers: StickerRecord[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 30-Slot Pack View Model for UI & Canvas integration
 */
export interface SlotItem {
  slotIndex: number; // 0..29
  sticker: StickerRecord | null;
  hasDraft?: boolean;
  draftThumbnail?: string | null;
  draftUpdatedAt?: number | null;
}

export interface PackDetailView {
  pack: StickerPackRecord;
  slots: SlotItem[]; // Array of 30 slots (indices 0 to 29)
  totalOccupied: number;
  totalDrafts: number;
  isReadyForWhatsApp: boolean; // >= 3 stickers
}

/**
 * API Request & Response Types
 */

export interface CreatePackRequest {
  title: string;
  publisher: string;
  trayIconUrl?: string;
  trayIcon?: File | Blob | string;
}

export interface UpdatePackRequest {
  title?: string;
  publisher?: string;
  trayIconUrl?: string;
  isPublished?: boolean;
  isPublic?: boolean;
}

export interface CommitSlotStickerRequest {
  slotIndex: number; // 0..29
  imageUrl?: string;
  imageFile?: File | Blob;
  emojis?: string[];
  isAnimated?: boolean;
  fileSize?: number;
}

export interface PacksListResponse {
  packs: StickerPackRecord[];
}

export interface PackDetailResponse {
  pack: StickerPackRecord;
}

export interface SlotCommitResponse {
  message: string;
  sticker: StickerRecord;
  pack: StickerPackRecord;
}
