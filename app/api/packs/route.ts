import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionUser } from "@/lib/get-user-session";
import { memoryPacks } from "@/lib/memory-store";

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

/**
 * GET /api/packs
 * Retrieves all sticker packs ordered by latest creation/update.
 */
export async function GET(req: Request) {
  try {
    const user = await getOrCreateSessionUser(req);
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter"); // "mine" | "community" | "all"

    let whereClause: any;
    if (filter === "mine") {
      whereClause = { authorId: user.id };
    } else if (filter === "community") {
      whereClause = { isPublished: true, isPublic: true, NOT: { authorId: user.id } };
    } else {
      // Default: show the current user's packs. If the user is an authenticated creator, also show public community packs.
      // If the user is a guest, show only the guest's own packs.
      if (user.id.startsWith("guest_")) {
        whereClause = { authorId: user.id };
      } else {
        whereClause = {
          OR: [
            { authorId: user.id },
            { isPublished: true, isPublic: true },
          ],
        };
      }
    }

    const packs = await prisma.stickerPack.findMany({
      where: whereClause,
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    return jsonResponse({ packs });
  } catch (error: any) {
    console.warn("Prisma packs query unavailable, falling back to memory store:", error?.message);
    const fallbackPacks = Array.from(memoryPacks.values());
    return jsonResponse({ packs: fallbackPacks });
  }
}

/**
 * POST /api/packs
 * Creates a new sticker pack in PostgreSQL.
 * Accepts either JSON or multipart/form-data.
 */
export async function POST(req: Request) {
  try {
    const user = await getOrCreateSessionUser(req);
    const contentType = req.headers.get("content-type") || "";

    let packTitle = "Untitled Pack";
    let authorName = user.username || "Sticker Studio Creator";
    let trayIconUrl = "";
    let trayIconFile: File | Blob | null = null;
    const initialStickers: Array<{ file?: File | Blob; url?: string; slotIndex: number; emojis?: string[] }> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      packTitle =
        (formData.get("packTitle") as string) ||
        (formData.get("title") as string) ||
        (formData.get("name") as string) ||
        "Untitled Pack";
      authorName =
        (formData.get("authorName") as string) ||
        (formData.get("creator") as string) ||
        (formData.get("publisher") as string) ||
        user.username ||
        "Sticker Studio Creator";
      
      trayIconFile = formData.get("trayIcon") as File | Blob | null;
      trayIconUrl = (formData.get("trayIconUrl") as string) || "";

      // Optional bulk stickers passed during creation
      const stickerFiles = formData.getAll("stickers") as (File | Blob)[];
      stickerFiles.forEach((file, index) => {
        initialStickers.push({ file, slotIndex: index, emojis: ["✨"] });
      });
    } else {
      const body = await req.json().catch(() => ({}));
      packTitle = body.title || body.name || body.packTitle || "Untitled Pack";
      authorName = body.publisher || body.creator || body.authorName || user.username || "Sticker Studio Creator";
      trayIconUrl = body.trayIconUrl || "";
    }

    // Upload Tray Icon if provided as a File
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (trayIconFile && hasBlobToken) {
      try {
        const trayFileName = `packs/${user.id}/${Date.now()}_tray.png`;
        const trayBlob = await put(trayFileName, trayIconFile, {
          access: "public",
          contentType: "image/png",
        });
        trayIconUrl = trayBlob.url;
      } catch (blobErr) {
        console.warn("Tray icon blob upload warning:", blobErr);
      }
    }

    // Default tray icon placeholder if none provided
    if (!trayIconUrl) {
      trayIconUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(packTitle)}`;
    }

    // Create the pack record in PostgreSQL
    const newPack = await prisma.stickerPack.create({
      data: {
        title: packTitle.trim(),
        publisher: authorName.trim(),
        trayIconUrl: trayIconUrl,
        authorId: user.id,
        isPublic: true,
        isPublished: true,
        downloadCount: 0,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // If initial stickers were included, upload and record them in their slots
    const createdStickers: any[] = [];
    for (const stk of initialStickers) {
      let stickerUrl = stk.url || "";
      if (stk.file && hasBlobToken) {
        try {
          const stickerBlob = await put(
            `packs/${user.id}/${newPack.id}_slot_${stk.slotIndex}.webp`,
            stk.file,
            { access: "public", contentType: "image/webp" }
          );
          stickerUrl = stickerBlob.url;
        } catch (e) {
          console.warn("Initial sticker upload warning:", e);
        }
      }

      if (stickerUrl) {
        const record = await prisma.sticker.create({
          data: {
            packId: newPack.id,
            slotIndex: stk.slotIndex,
            order: stk.slotIndex + 1,
            imageUrl: stickerUrl,
            emojis: stk.emojis || ["✨"],
          },
        });
        createdStickers.push(record);
      }
    }

    return jsonResponse(
      {
        message: "Sticker pack created successfully!",
        pack: {
          ...newPack,
          stickers: createdStickers,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating sticker pack:", error);
    return jsonResponse(
      { error: "Failed to create sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packs
 * Deletes a sticker pack by query param `?id=...`.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const packId = searchParams.get("id");

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    await prisma.sticker.deleteMany({
      where: { packId },
    });

    await prisma.stickerPack.delete({
      where: { id: packId },
    });

    return jsonResponse({ message: "Sticker pack deleted successfully", id: packId });
  } catch (error: any) {
    console.error("Error deleting pack:", error);
    return jsonResponse(
      { error: "Failed to delete sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}
