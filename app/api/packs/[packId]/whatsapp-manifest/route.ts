import { prisma } from "@/lib/prisma";

const jsonResponse = (
  data: any,
  init?: { status?: number; headers?: Record<string, string> }
) => {
  return new Response(JSON.stringify(data, null, 2), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      ...(init?.headers || {}),
    },
  });
};

interface RouteContext {
  params: {
    packId: string;
  };
}

const DEFAULT_EMOJI_LIST = ["✨", "🔥", "😎", "😂", "🚀", "❤️", "👍", "🥳", "🎉", "👏"];

/**
 * GET /api/packs/[packId]/whatsapp-manifest
 *
 * Conforms to the official WhatsApp Sticker Specification (WhatsApp/stickers):
 * - contents.json schema
 * - Strict limits: 3 to 30 stickers, 512x512 dimensions, static <= 100KB, animated <= 500KB
 * - Tray icon: 96x96 px <= 50KB
 * - 1 to 3 emojis per sticker
 * - Android Intent & iOS URL Scheme metadata for bridge handoff
 */
export async function GET(req: Request, context?: RouteContext) {
  try {
    let packId = context?.params?.packId;
    const url = new URL(req.url);

    if (!packId) {
      const segments = url.pathname.split("/").filter(Boolean);
      const packsIndex = segments.indexOf("packs");
      if (packsIndex !== -1 && segments[packsIndex + 1]) {
        packId = segments[packsIndex + 1];
      }
    }

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    const format = url.searchParams.get("format")?.toLowerCase();

    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      include: {
        stickers: {
          orderBy: { slotIndex: "asc" },
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!pack) {
      return jsonResponse({ error: "Sticker pack not found." }, { status: 404 });
    }

    const host = url.host || "localhost:3000";
    const protocol = url.protocol || "https:";
    const baseUrl = `${protocol}//${host}`;

    // Standardized WhatsApp identifier: alphanumeric and underscores only, max 128 chars
    const rawIdentifier = `omoji_${pack.id.replace(/[^a-zA-Z0-9_]/g, "_")}`.slice(0, 128);
    const packName = (pack.title || "Untitled Pack").trim().slice(0, 128);
    const publisherName = (pack.publisher || pack.author?.username || "Omoji Creator").trim().slice(0, 128);

    const errors: string[] = [];
    const warnings: string[] = [];

    // WhatsApp Rule: Minimum 3 stickers, Maximum 30 stickers
    const totalStickers = pack.stickers.length;
    if (totalStickers < 3) {
      errors.push(`WhatsApp requires at least 3 stickers in a pack. Currently has ${totalStickers}.`);
    }
    if (totalStickers > 30) {
      warnings.push(`WhatsApp allows a maximum of 30 stickers per pack. The pack contains ${totalStickers}; only the first 30 will be imported.`);
    }

    // Determine if any sticker is animated
    const isAnimatedPack = pack.stickers.some((s) => s.isAnimated);

    // Build standardized stickers list (capped at 30)
    const validStickersList = pack.stickers.slice(0, 30).map((sticker, idx) => {
      const fileName = `${idx + 1}.webp`;
      let stickerEmojis = Array.isArray(sticker.emojis) && sticker.emojis.length > 0
        ? sticker.emojis.slice(0, 3)
        : [DEFAULT_EMOJI_LIST[idx % DEFAULT_EMOJI_LIST.length]];

      // Validate individual sticker size constraints if known
      if (sticker.fileSize && sticker.fileSize > 0) {
        const maxBytes = sticker.isAnimated ? 500 * 1024 : 100 * 1024;
        if (sticker.fileSize > maxBytes) {
          warnings.push(
            `Sticker #${idx + 1} (${Math.round(sticker.fileSize / 1024)} KB) exceeds WhatsApp ${
              sticker.isAnimated ? "animated (500 KB)" : "static (100 KB)"
            } threshold. Optimize before importing.`
          );
        }
      }

      // Convert relative image URLs to absolute if needed
      let absoluteImageUrl = sticker.imageUrl;
      if (absoluteImageUrl && absoluteImageUrl.startsWith("/")) {
        absoluteImageUrl = `${baseUrl}${absoluteImageUrl}`;
      }

      return {
        image_file: fileName,
        image_url: absoluteImageUrl,
        emojis: stickerEmojis,
        accessibility_text: `${packName} Sticker #${idx + 1}`,
        file_size_bytes: sticker.fileSize || undefined,
        is_animated: Boolean(sticker.isAnimated),
      };
    });

    let absoluteTrayIconUrl = pack.trayIconUrl;
    if (absoluteTrayIconUrl && absoluteTrayIconUrl.startsWith("/")) {
      absoluteTrayIconUrl = `${baseUrl}${absoluteTrayIconUrl}`;
    }

    // Official WhatsApp Sticker Pack Manifest Object
    const officialPackObject = {
      identifier: rawIdentifier,
      name: packName,
      publisher: publisherName,
      tray_image_file: "tray_icon.png",
      tray_image_url: absoluteTrayIconUrl,
      publisher_email: pack.author?.email || "support@omoji.app",
      publisher_website: `${baseUrl}/packs/${pack.id}`,
      privacy_policy_website: `${baseUrl}/privacy`,
      license_agreement_website: `${baseUrl}/terms`,
      image_data_version: String(pack.updatedAt ? new Date(pack.updatedAt).getTime() : "1"),
      avoid_cache: false,
      animated_sticker_pack: isAnimatedPack,
      stickers: validStickersList,
    };

    // Official WhatsApp contents.json schema
    const officialContentsJson = {
      android_play_store_link: "",
      ios_app_store_link: "",
      sticker_packs: [officialPackObject],
    };

    // If caller requested raw contents.json for ContentProviders or direct WhatsApp tools:
    if (format === "contents.json" || format === "contents" || format === "raw") {
      return jsonResponse(officialContentsJson);
    }

    const isReadyForWhatsApp = errors.length === 0 && totalStickers >= 3;
    const status = errors.length > 0 ? "non_compliant" : warnings.length > 0 ? "warning" : "compliant";

    // Intent strings and deep-link payload contracts for Phase 2 / Phase 3
    const androidAuthority = "com.omoji.stickers.provider";
    const androidIntentUri = `intent://#Intent;action=com.whatsapp.intent.action.ENABLE_STICKER_PACK;package=com.whatsapp;S.extra_sticker_pack_id=${encodeURIComponent(
      rawIdentifier
    )};S.extra_sticker_pack_authority=${encodeURIComponent(
      androidAuthority
    )};S.extra_sticker_pack_name=${encodeURIComponent(packName)};end`;

    const iosUrlScheme = `whatsapp://stickerPack?authority=${encodeURIComponent(
      androidAuthority
    )}&identifier=${encodeURIComponent(rawIdentifier)}`;

    return jsonResponse({
      success: true,
      meta: {
        spec_version: "1.0",
        standard: "WhatsApp/stickers Official Specification",
        generated_at: new Date().toISOString(),
      },
      diagnostics: {
        status,
        is_ready_for_whatsapp: isReadyForWhatsApp,
        total_stickers: totalStickers,
        min_required: 3,
        max_allowed: 30,
        is_count_valid: totalStickers >= 3 && totalStickers <= 30,
        is_animated_pack: isAnimatedPack,
        errors,
        warnings,
      },
      pack: officialPackObject,
      contents: officialContentsJson,
      integration: {
        android: {
          action: "com.whatsapp.intent.action.ENABLE_STICKER_PACK",
          package: "com.whatsapp",
          authority: androidAuthority,
          pack_id: rawIdentifier,
          intent_uri: androidIntentUri,
        },
        ios: {
          url_scheme: iosUrlScheme,
          pasteboard_key: "net.whatsapp.WhatsApp.stickerpack",
          identifier: rawIdentifier,
        },
        endpoints: {
          manifest_url: `${baseUrl}/api/packs/${pack.id}/whatsapp-manifest`,
          raw_contents_url: `${baseUrl}/api/packs/${pack.id}/whatsapp-manifest?format=contents.json`,
          download_wastickers_url: `${baseUrl}/api/packs/${pack.id}?format=wastickers`,
        },
      },
    });
  } catch (error: any) {
    console.error("WhatsApp manifest generation error:", error);
    return jsonResponse(
      {
        error: "Failed to generate WhatsApp sticker manifest.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
