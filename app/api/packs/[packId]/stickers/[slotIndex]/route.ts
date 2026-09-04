import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionUser } from "@/lib/get-user-session";

const jsonResponse = (
  data: any,
  init?: { status?: number; headers?: Record<string, string> }
) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
};

interface RouteContext {
  params: {
    packId: string;
    slotIndex: string;
  };
}

function parseParams(req: Request, context?: RouteContext): { packId: string; slotIndex: number } {
  let packId = context?.params?.packId || "";
  let slotIndex = context?.params?.slotIndex !== undefined ? parseInt(context.params.slotIndex, 10) : NaN;

  if (!packId || isNaN(slotIndex)) {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const packsIdx = segments.indexOf("packs");
    if (packsIdx !== -1) {
      packId = segments[packsIdx + 1] || "";
      const stickersIdx = segments.indexOf("stickers");
      if (stickersIdx !== -1 && segments[stickersIdx + 1] !== undefined) {
        slotIndex = parseInt(segments[stickersIdx + 1], 10);
      }
    }
  }

  return { packId, slotIndex };
}

/**
 * POST /api/packs/[packId]/stickers/[slotIndex]
 * Saves / commits a sticker image to a specific slot (0..29) in the pack.
 */
export async function POST(req: Request, context?: RouteContext) {
  try {
    const user = await getOrCreateSessionUser(req);
    const { packId, slotIndex } = parseParams(req, context);

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 29) {
      return jsonResponse(
        { error: "Invalid slotIndex. Slot index must be an integer between 0 and 29." },
        { status: 400 }
      );
    }

    // Verify pack existence
    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      return jsonResponse({ error: "Sticker pack not found." }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let imageUrl = "";
    let emojis: string[] = ["✨"];
    let isAnimated = false;
    let fileSize = 0;

    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const stickerEntry = formData.get("sticker") || formData.get("image") || formData.get("file");
      
      const emojiRaw = formData.get("emojis");
      if (emojiRaw) {
        try {
          emojis = typeof emojiRaw === "string" && emojiRaw.startsWith("[")
            ? JSON.parse(emojiRaw)
            : [String(emojiRaw)];
        } catch {
          emojis = [String(emojiRaw)];
        }
      }

      if (formData.has("isAnimated")) {
        isAnimated = formData.get("isAnimated") === "true";
      }

      if (stickerEntry && typeof stickerEntry !== "string") {
        const stickerFile = stickerEntry as File | Blob;
        fileSize = stickerFile.size;
        if (hasBlobToken) {
          const blobRes = await put(
            `packs/${user.id}/${packId}_slot_${slotIndex}_${Date.now()}.webp`,
            stickerFile,
            { access: "public", contentType: "image/webp" }
          );
          imageUrl = blobRes.url;
        } else {
          // If no Vercel Blob token, convert buffer to base64 DataURL for local preview
          const arrayBuf = await stickerFile.arrayBuffer();
          const base64 = Buffer.from(arrayBuf).toString("base64");
          imageUrl = `data:image/webp;base64,${base64}`;
        }
      } else if (formData.has("imageUrl")) {
        imageUrl = formData.get("imageUrl") as string;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      imageUrl = body.imageUrl || body.url || body.webpUrl || "";
      if (Array.isArray(body.emojis)) emojis = body.emojis;
      if (typeof body.isAnimated === "boolean") isAnimated = body.isAnimated;
      if (typeof body.fileSize === "number") fileSize = body.fileSize;
    }

    if (!imageUrl) {
      return jsonResponse(
        { error: "A valid sticker image file or imageUrl is required." },
        { status: 400 }
      );
    }

    // If imageUrl is a base64 DataURL and Vercel Blob token is configured, stream buffer directly to Vercel Blob
    if (hasBlobToken && imageUrl.startsWith("data:")) {
      try {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1] || "image/webp";
          const ext = mimeType.includes("gif") ? "gif" : mimeType.includes("png") ? "png" : "webp";
          const buffer = Buffer.from(matches[2], "base64");
          fileSize = buffer.length;

          const blobRes = await put(
            `packs/${user.id}/${packId}_slot_${slotIndex}_${Date.now()}.${ext}`,
            buffer,
            { access: "public", contentType: mimeType }
          );
          imageUrl = blobRes.url;
        }
      } catch (blobUploadErr) {
        console.warn("Base64 Vercel Blob upload fallback warning:", blobUploadErr);
      }
    }

    // Upsert sticker into the specific slot
    const sticker = await prisma.sticker.upsert({
      where: {
        packId_slotIndex: {
          packId,
          slotIndex,
        },
      },
      update: {
        imageUrl,
        emojis,
        isAnimated,
        fileSize,
        order: slotIndex + 1,
        updatedAt: new Date(),
      },
      create: {
        packId,
        slotIndex,
        order: slotIndex + 1,
        imageUrl,
        emojis,
        isAnimated,
        fileSize,
      },
    });

    // Touch pack updatedAt & fallback trayIcon if empty
    const updatedPack = await prisma.stickerPack.update({
      where: { id: packId },
      data: {
        updatedAt: new Date(),
        ...(!pack.trayIconUrl || pack.trayIconUrl.includes("dicebear")
          ? { trayIconUrl: imageUrl }
          : {}),
      },
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc",
          },
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

    return jsonResponse(
      {
        message: `Sticker successfully saved to slot ${slotIndex + 1}!`,
        sticker,
        pack: updatedPack,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error committing sticker to slot:", error);
    return jsonResponse(
      { error: "Failed to save sticker to slot.", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packs/[packId]/stickers/[slotIndex]
 * Clears/removes the sticker from a specific slot.
 */
export async function DELETE(req: Request, context?: RouteContext) {
  try {
    const { packId, slotIndex } = parseParams(req, context);

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 29) {
      return jsonResponse(
        { error: "Invalid slotIndex. Must be between 0 and 29." },
        { status: 400 }
      );
    }

    await prisma.sticker.deleteMany({
      where: {
        packId,
        slotIndex,
      },
    });

    const updatedPack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc",
          },
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

    return jsonResponse({
      message: `Sticker cleared from slot ${slotIndex + 1}.`,
      pack: updatedPack,
      slotIndex,
    });
  } catch (error: any) {
    console.error("Error removing sticker from slot:", error);
    return jsonResponse(
      { error: "Failed to clear sticker from slot.", details: error?.message },
      { status: 500 }
    );
  }
}
