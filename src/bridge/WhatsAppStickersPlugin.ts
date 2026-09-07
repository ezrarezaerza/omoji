import { registerPlugin, Capacitor } from "@capacitor/core";

export interface WhatsAppAppStatus {
  installed: boolean;
  consumerApp: boolean;
  businessApp: boolean;
  platform: "android" | "ios" | "web";
}

export interface AddStickerPackOptions {
  packId: string;
  packName: string;
  publisher: string;
  trayIconUrl: string;
  manifestUrl?: string;
  contentsJson?: any;
}

export interface AddStickerPackResult {
  success: boolean;
  code?: "SUCCESS" | "USER_CANCELLED" | "NOT_INSTALLED" | "VALIDATION_FAILED" | "HANDOFF_DISPATCHED" | "UNKNOWN_ERROR";
  message?: string;
  details?: any;
}

export interface WhatsAppStickersPlugin {
  checkWhatsAppInstalled(): Promise<WhatsAppAppStatus>;
  addStickerPack(options: AddStickerPackOptions): Promise<AddStickerPackResult>;
  openWhatsApp(): Promise<{ success: boolean }>;
  triggerAndroidIntent(options: { intentUri: string }): Promise<{ success: boolean }>;
}

/**
 * Resilient Web / PWA Fallback implementation for WhatsAppStickersPlugin
 * Used when running inside a standard mobile or desktop web browser
 */
class WhatsAppStickersWeb implements WhatsAppStickersPlugin {
  async checkWhatsAppInstalled(): Promise<WhatsAppAppStatus> {
    const isMobile = typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

    return {
      installed: isMobile, // Cannot directly inspect other app packages from a web sandbox
      consumerApp: isMobile,
      businessApp: false,
      platform: isAndroid ? "android" : isIOS ? "ios" : "web",
    };
  }

  async addStickerPack(options: AddStickerPackOptions): Promise<AddStickerPackResult> {
    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

    const safePackId = (options.packId || "").replace(/[^a-zA-Z0-9_]/g, "_");
    const safePackName = encodeURIComponent(options.packName || "Sticker Pack");
    const authority = "com.omoji.stickers.provider";

    if (isAndroid) {
      // Direct Android Intent URI to trigger WhatsApp's ENABLE_STICKER_PACK
      const intentUri = `intent://#Intent;action=com.whatsapp.intent.action.ENABLE_STICKER_PACK;package=com.whatsapp;S.extra_sticker_pack_id=omoji_${safePackId};S.extra_sticker_pack_authority=${authority};S.extra_sticker_pack_name=${safePackName};end`;

      // Try launching intent directly
      try {
        window.location.href = intentUri;
        return {
          success: true,
          code: "HANDOFF_DISPATCHED",
          message: "Triggered native WhatsApp intent.",
          details: { intentUri },
        };
      } catch (err: any) {
        return {
          success: false,
          code: "UNKNOWN_ERROR",
          message: err?.message || "Failed to trigger Android intent from browser.",
        };
      }
    }

    if (isIOS) {
      const iosScheme = `whatsapp://stickerPack?authority=${authority}&identifier=omoji_${safePackId}`;
      try {
        window.location.href = iosScheme;
        return {
          success: true,
          code: "HANDOFF_DISPATCHED",
          message: "Triggered WhatsApp iOS URL scheme.",
          details: { iosScheme },
        };
      } catch (err: any) {
        return {
          success: false,
          code: "UNKNOWN_ERROR",
          message: err?.message || "Failed to launch iOS WhatsApp scheme.",
        };
      }
    }

    return {
      success: false,
      code: "VALIDATION_FAILED",
      message: "Direct 1-tap installation requires an Android or iOS device with WhatsApp installed.",
    };
  }

  async openWhatsApp(): Promise<{ success: boolean }> {
    try {
      window.location.href = "whatsapp://";
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async triggerAndroidIntent(options: { intentUri: string }): Promise<{ success: boolean }> {
    try {
      window.location.href = options.intentUri;
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

export const WhatsAppStickers = registerPlugin<WhatsAppStickersPlugin>("WhatsAppStickers", {
  web: () => new WhatsAppStickersWeb(),
});
