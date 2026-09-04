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
  };
}

/**
 * GET /api/packs/[packId]
 * Retrieves a single pack by ID along with its 30-slot sticker manifest.
 */
export async function GET(req: Request, context?: RouteContext) {
  try {
    let packId = context?.params?.packId;
    if (!packId) {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const packsIndex = segments.indexOf("packs");
      if (packsIndex !== -1 && segments[packsIndex + 1]) {
        packId = segments[packsIndex + 1];
      }
    }

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    const pack = await prisma.stickerPack.findUnique({
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

    if (!pack) {
      return jsonResponse({ error: "Sticker pack not found." }, { status: 404 });
    }

    return jsonResponse({ pack });
  } catch (error: any) {
    console.error("Error fetching pack details:", error);
    return jsonResponse(
      { error: "Failed to fetch pack details.", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * PUT / PATCH /api/packs/[packId]
 * Updates metadata for a sticker pack (name, creator, tray icon, published state).
 */
export async function PUT(req: Request, context?: RouteContext) {
  try {
    const user = await getOrCreateSessionUser(req);

    let packId = context?.params?.packId;
    if (!packId) {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const packsIndex = segments.indexOf("packs");
      if (packsIndex !== -1 && segments[packsIndex + 1]) {
        packId = segments[packsIndex + 1];
      }
    }

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") || "";
    let title: string | undefined;
    let publisher: string | undefined;
    let trayIconUrl: string | undefined;
    let isPublished: boolean | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      if (formData.has("title")) title = (formData.get("title") as string).trim();
      if (formData.has("name")) title = (formData.get("name") as string).trim();
      if (formData.has("packTitle")) title = (formData.get("packTitle") as string).trim();

      if (formData.has("publisher")) publisher = (formData.get("publisher") as string).trim();
      if (formData.has("creator")) publisher = (formData.get("creator") as string).trim();
      if (formData.has("authorName")) publisher = (formData.get("authorName") as string).trim();

      if (formData.has("isPublished")) {
        isPublished = formData.get("isPublished") === "true";
      }

      const trayFile = formData.get("trayIcon") as File | Blob | null;
      if (trayFile && Boolean(process.env.BLOB_READ_WRITE_TOKEN)) {
        try {
          const trayBlob = await put(
            `packs/${user.id}/${packId}_tray_${Date.now()}.png`,
            trayFile,
            { access: "public", contentType: "image/png" }
          );
          trayIconUrl = trayBlob.url;
        } catch (e) {
          console.warn("Tray upload error:", e);
        }
      } else if (formData.has("trayIconUrl")) {
        trayIconUrl = formData.get("trayIconUrl") as string;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.title || body.name || body.packTitle) {
        title = (body.title || body.name || body.packTitle).trim();
      }
      if (body.publisher || body.creator || body.authorName) {
        publisher = (body.publisher || body.creator || body.authorName).trim();
      }
      if (body.trayIconUrl) {
        trayIconUrl = body.trayIconUrl;
      }
      if (typeof body.isPublished === "boolean") {
        isPublished = body.isPublished;
      }
    }

    const updatedPack = await prisma.stickerPack.update({
      where: { id: packId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(publisher !== undefined ? { publisher } : {}),
        ...(trayIconUrl !== undefined ? { trayIconUrl } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
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

    return jsonResponse({
      message: "Sticker pack updated successfully.",
      pack: updatedPack,
    });
  } catch (error: any) {
    console.error("Error updating pack:", error);
    return jsonResponse(
      { error: "Failed to update sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packs/[packId]
 * Deletes a sticker pack and all associated stickers.
 */
export async function DELETE(req: Request, context?: RouteContext) {
  try {
    const user = await getOrCreateSessionUser(req);

    let packId = context?.params?.packId;
    if (!packId) {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const packsIndex = segments.indexOf("packs");
      if (packsIndex !== -1 && segments[packsIndex + 1]) {
        packId = segments[packsIndex + 1];
      }
    }

    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }

    // Check if pack exists
    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      select: { id: true, authorId: true, title: true },
    });

    if (!pack) {
      return jsonResponse({ message: "Sticker pack not found or already deleted.", id: packId }, { status: 200 });
    }

    // If user is neither the author nor an admin, verify ownership
    if (pack.authorId && pack.authorId !== user.id && !user.id.startsWith("admin")) {
      return jsonResponse(
        { error: "You do not have permission to delete this sticker pack." },
        { status: 403 }
      );
    }

    // Cascade delete stickers and the pack
    await prisma.$transaction([
      prisma.sticker.deleteMany({
        where: { packId },
      }),
      prisma.stickerPack.delete({
        where: { id: packId },
      }),
    ]);

    return jsonResponse({ message: "Sticker pack deleted successfully.", id: packId });
  } catch (error: any) {
    console.error("Error deleting pack:", error);
    return jsonResponse(
      { error: "Failed to delete sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}
