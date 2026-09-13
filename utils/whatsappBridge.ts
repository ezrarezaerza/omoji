import { Capacitor } from "@capacitor/core";
import { WhatsAppStickers, AddStickerPackResult, WhatsAppAppStatus } from "../src/bridge/WhatsAppStickersPlugin";
import { StickerPackRecord } from "../src/types/pack";

export interface DeviceEnvironment {
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  platform: "android" | "ios" | "web";
}

export interface WhatsAppInstallResult {
  success: boolean;
  method: "native_plugin" | "android_intent" | "ios_scheme" | "bridge_companion" | "fallback_guide";
  message: string;
  details?: any;
}

/**
 * Detects the client runtime environment and OS
 */
export function getDeviceEnvironment(): DeviceEnvironment {
  const isNative = Capacitor.isNativePlatform();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMobile = isAndroid || isIOS || /mobile/i.test(ua);
  const isDesktop = !isMobile;

  const platform: "android" | "ios" | "web" = isNative
    ? (Capacitor.getPlatform() as "android" | "ios")
    : isAndroid
    ? "android"
    : isIOS
    ? "ios"
    : "web";

  return {
    isNative,
    isAndroid,
    isIOS,
    isMobile,
    isDesktop,
    platform,
  };
}

/**
 * Checks WhatsApp installation status
 */
export async function checkWhatsAppAvailability(): Promise<WhatsAppAppStatus> {
  try {
    return await WhatsAppStickers.checkWhatsAppInstalled();
  } catch {
    const env = getDeviceEnvironment();
    return {
      installed: env.isMobile,
      consumerApp: env.isMobile,
      businessApp: false,
      platform: env.platform,
    };
  }
}

/**
 * 1-Tap Universal WhatsApp Sticker Installer
 *
 * Directs the pack to WhatsApp via:
 * 1. Native Capacitor Plugin (when inside the Android / iOS App Shell)
 * 2. Android Intent URI / Deep Link (when in mobile Chrome)
 * 3. iOS WhatsApp Scheme (when in mobile Safari)
 */
export async function installPackToWhatsApp(
  pack: StickerPackRecord,
  options: {
    onProgress?: (step: string, percentage: number) => void;
  } = {}
): Promise<WhatsAppInstallResult> {
  const { onProgress } = options;
  const env = getDeviceEnvironment();

  onProgress?.("Validating pack requirements...", 15);

  const totalStickers = Array.isArray(pack.stickers) ? pack.stickers.length : 0;
  if (totalStickers < 3) {
    return {
      success: false,
      method: "fallback_guide",
      message: `WhatsApp requires at least 3 stickers to add a pack (currently has ${totalStickers}). Please add more stickers!`,
    };
  }

  const safePackId = (pack.id || "").replace(/[^a-zA-Z0-9_]/g, "_");
  const packName = pack.title || "Sticker Pack";
  const publisher = pack.publisher || "Omoji Creator";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const manifestUrl = `${baseUrl}/api/packs/${pack.id}/whatsapp-manifest`;

  // 1. If running in Native Capacitor App (Android / iOS):
  if (env.isNative) {
    onProgress?.("Preparing sticker pack for WhatsApp...", 40);
    try {
      const res: AddStickerPackResult = await WhatsAppStickers.addStickerPack({
        packId: safePackId,
        packName,
        publisher,
        trayIconUrl: pack.trayIconUrl,
        manifestUrl,
      });

      if (res.success) {
        onProgress?.("Added to WhatsApp!", 100);
        return {
          success: true,
          method: "native_plugin",
          message: res.message || "Sticker pack successfully added to WhatsApp!",
          details: res,
        };
      } else {
        return {
          success: false,
          method: "native_plugin",
          message: res.message || "Failed to add sticker pack to WhatsApp.",
          details: res,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        method: "native_plugin",
        message: err?.message || "Native WhatsApp bridge encountered an error.",
      };
    }
  }

  // 2. If running on Mobile Web (Android):
  if (env.isAndroid) {
    onProgress?.("Checking Android WhatsApp capabilities...", 60);

    // Note: Android Chrome cannot directly register a ContentProvider into WhatsApp's private database
    // without an installed companion APK. Calling the raw intent without the companion app causes Chrome
    // to open Google Play Store looking for com.omoji.stickers.provider.
    return {
      success: false,
      method: "fallback_guide",
      message:
        "To use your stickers right now without installing anything, use 'Send to WhatsApp Chat & Star ⭐' or download the WhatsApp sticker pack!",
      details: {
        suggestedAction: "share_or_archive",
        intentUri: `intent://#Intent;action=com.whatsapp.intent.action.ENABLE_STICKER_PACK;package=com.whatsapp;S.extra_sticker_pack_id=omoji_${safePackId};S.extra_sticker_pack_authority=com.omoji.stickers.provider;S.extra_sticker_pack_name=${encodeURIComponent(packName)};end`,
      },
    };
  }

  // 3. If running on Mobile Web (iOS):
  if (env.isIOS) {
    onProgress?.("Connecting to WhatsApp for iOS...", 60);
    const authority = "com.omoji.stickers";
    const iosScheme = `whatsapp://stickerPack?authority=${authority}&identifier=omoji_${safePackId}`;

    try {
      window.location.href = iosScheme;
      onProgress?.("Handoff sent to WhatsApp!", 100);
      return {
        success: true,
        method: "ios_scheme",
        message: "Opening WhatsApp...",
        details: { iosScheme },
      };
    } catch (err: any) {
      return {
        success: false,
        method: "ios_scheme",
        message: err?.message || "Could not launch WhatsApp scheme.",
      };
    }
  }

  // 4. If running on Desktop:
  return {
    success: false,
    method: "fallback_guide",
    message: "Direct 1-tap installation requires a mobile device with WhatsApp installed. Use Mobile Transfer (QR Code) or download the WhatsApp sticker pack.",
  };
}
