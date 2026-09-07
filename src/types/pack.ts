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

/**
 * WhatsApp Official Sticker Provider Specification Types
 * Reference: WhatsApp/stickers official specification & contents.json standard
 */
export interface WhatsAppStickerItemSpec {
  image_file: string;
  image_url?: string;
  emojis: string[];
  accessibility_text?: string;
  file_size_bytes?: number;
  is_animated?: boolean;
}

export interface WhatsAppPackSpec {
  identifier: string;
  name: string;
  publisher: string;
  tray_image_file: string;
  tray_image_url?: string;
  publisher_email?: string;
  publisher_website?: string;
  privacy_policy_website?: string;
  license_agreement_website?: string;
  image_data_version: string;
  avoid_cache: boolean;
  animated_sticker_pack: boolean;
  stickers: WhatsAppStickerItemSpec[];
}

export interface WhatsAppContentsJson {
  android_play_store_link: string;
  ios_app_store_link: string;
  sticker_packs: WhatsAppPackSpec[];
}

export interface WhatsAppManifestDiagnostics {
  status: "compliant" | "warning" | "non_compliant";
  is_ready_for_whatsapp: boolean;
  total_stickers: number;
  min_required: number;
  max_allowed: number;
  is_count_valid: boolean;
  is_animated_pack: boolean;
  errors: string[];
  warnings: string[];
}

export interface WhatsAppManifestResponse {
  success: boolean;
  meta: {
    spec_version: string;
    standard: string;
    generated_at: string;
  };
  diagnostics: WhatsAppManifestDiagnostics;
  pack: WhatsAppPackSpec;
  contents: WhatsAppContentsJson;
  integration: {
    android: {
      action: string;
      package: string;
      authority: string;
      pack_id: string;
      intent_uri: string;
    };
    ios: {
      url_scheme: string;
      pasteboard_key: string;
      identifier: string;
    };
    endpoints: {
      manifest_url: string;
      raw_contents_url: string;
      download_wastickers_url: string;
    };
  };
}

