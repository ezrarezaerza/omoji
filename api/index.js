// server-app.ts
import "dotenv/config";
import express from "express";

// app/api/search/giphy/route.ts
var FALLBACK_GIFS = [
  {
    id: "fallback-cat-vibing",
    title: "Cat Vibing Meme",
    previewUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
    fullUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
    mp4Url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.mp4",
    width: 480,
    height: 480
  },
  {
    id: "fallback-doge-dance",
    title: "Doge Dancing Celebration",
    previewUrl: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
    fullUrl: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
    mp4Url: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.mp4",
    width: 500,
    height: 500
  },
  {
    id: "fallback-pop-cat",
    title: "Pop Cat GIF",
    previewUrl: "https://media.giphy.com/media/ZeB5RzwVUoxWg2EvEl/giphy.gif",
    fullUrl: "https://media.giphy.com/media/ZeB5RzwVUoxWg2EvEl/giphy.gif",
    width: 400,
    height: 400
  },
  {
    id: "fallback-mind-blown",
    title: "Mind Blown Reaction",
    previewUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    fullUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    width: 480,
    height: 270
  },
  {
    id: "fallback-happy-dance",
    title: "Happy Dance Celebration",
    previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    fullUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    width: 500,
    height: 375
  },
  {
    id: "fallback-deal-with-it",
    title: "Deal With It Glasses",
    previewUrl: "https://media.giphy.com/media/xUPGcxpCV81ebKh7Vu/giphy.gif",
    fullUrl: "https://media.giphy.com/media/xUPGcxpCV81ebKh7Vu/giphy.gif",
    width: 480,
    height: 480
  }
];
async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
    const apiKey = process.env.GIPHY_API_KEY || "dc6zaTOxFJmzC";
    const endpoint = query ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en` : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&offset=${offset}&rating=g`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8e3);
    let giphyResponse;
    try {
      giphyResponse = await fetch(endpoint, {
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!giphyResponse.ok) {
      console.warn(`Giphy API responded with status ${giphyResponse.status}. Falling back to curated results.`);
      const filtered = query ? FALLBACK_GIFS.filter((g) => g.title.toLowerCase().includes(query.toLowerCase())) : FALLBACK_GIFS;
      return new Response(
        JSON.stringify({
          success: true,
          data: filtered.length > 0 ? filtered : FALLBACK_GIFS,
          pagination: {
            total_count: FALLBACK_GIFS.length,
            count: filtered.length,
            offset: 0
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
          }
        }
      );
    }
    const json = await giphyResponse.json();
    const rawData = Array.isArray(json.data) ? json.data : [];
    const formattedData = rawData.map((item) => {
      const images = item.images || {};
      const preview = images.fixed_height_small?.url || images.fixed_width_downsampled?.url || images.downsized?.url || images.preview_gif?.url || images.original?.url || "";
      const full = images.original?.url || images.downsized_medium?.url || images.fixed_height?.url || preview;
      return {
        id: String(item.id || Math.random().toString(36).substring(2)),
        title: item.title || "Giphy Animated Meme",
        previewUrl: preview,
        fullUrl: full,
        mp4Url: images.original?.mp4 || images.looping?.mp4 || images.downsized_small?.mp4,
        webpUrl: images.original?.webp || images.fixed_height?.webp,
        width: parseInt(images.original?.width || "512", 10),
        height: parseInt(images.original?.height || "512", 10),
        slug: item.slug || ""
      };
    });
    const responseBody = {
      success: true,
      data: formattedData,
      pagination: {
        total_count: json.pagination?.total_count || formattedData.length,
        count: json.pagination?.count || formattedData.length,
        offset: json.pagination?.offset || offset
      }
    };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("Giphy search route error:", error);
    return new Response(
      JSON.stringify({
        success: true,
        data: FALLBACK_GIFS,
        pagination: {
          total_count: FALLBACK_GIFS.length,
          count: FALLBACK_GIFS.length,
          offset: 0
        },
        error: error?.message || "Failed to fetch from Giphy"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}

// app/api/proxy-image/route.ts
async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400"
    }
  });
}
async function GET2(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required 'url' query parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid target URL format. Must be http:// or https://" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    let remoteResponse;
    try {
      remoteResponse = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/*,video/*,*/*;q=0.8"
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!remoteResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `Remote resource returned HTTP ${remoteResponse.status}: ${remoteResponse.statusText}`
        }),
        {
          status: remoteResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
    const arrayBuffer = await remoteResponse.arrayBuffer();
    let contentType = remoteResponse.headers.get("content-type");
    if (!contentType || contentType === "application/octet-stream" || contentType === "text/plain") {
      const lowerUrl = parsedUrl.pathname.toLowerCase();
      if (lowerUrl.endsWith(".gif")) {
        contentType = "image/gif";
      } else if (lowerUrl.endsWith(".png")) {
        contentType = "image/png";
      } else if (lowerUrl.endsWith(".webp")) {
        contentType = "image/webp";
      } else if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) {
        contentType = "image/jpeg";
      } else if (lowerUrl.endsWith(".mp4")) {
        contentType = "video/mp4";
      } else {
        contentType = "image/gif";
      }
    }
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Length": String(arrayBuffer.byteLength)
      }
    });
  } catch (error) {
    console.error("CORS Image Proxy Error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to proxy remote media resource"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}

// app/api/packs/route.ts
import { put } from "@vercel/blob";

// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.trim()) {
    return new PrismaClient({
      datasourceUrl: "postgresql://fallback:fallback@localhost:5432/omoji?connection_limit=1",
      log: ["error"]
    });
  }
  const basePrisma = new PrismaClient({
    log: ["error", "warn"]
  });
  if (databaseUrl.startsWith("prisma://") || databaseUrl.includes("accelerate.prisma-data.net")) {
    return basePrisma.$extends(withAccelerate());
  }
  return basePrisma;
}
var prisma = globalThis.prismaGlobal ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// lib/get-user-session.ts
async function getOrCreateSessionUser(req) {
  const authHeader = req.headers.get("authorization");
  const userIdHeader = req.headers.get("x-user-id");
  let targetUserId = userIdHeader;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token && token !== "null" && token !== "undefined") {
      targetUserId = targetUserId || token;
    }
  }
  try {
    if (targetUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, username: true }
      });
      if (existingUser) return existingUser;
      if (targetUserId.startsWith("guest_") || targetUserId.startsWith("usr_")) {
        const guestUser = await prisma.user.create({
          data: {
            id: targetUserId,
            email: `${targetUserId}@guest.omoji.studio`,
            username: `creator_${targetUserId.slice(-6)}`,
            passwordHash: "guest_session"
          },
          select: { id: true, email: true, username: true }
        });
        return guestUser;
      }
    }
    const freshGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newGuest = await prisma.user.create({
      data: {
        id: freshGuestId,
        email: `${freshGuestId}@guest.omoji.studio`,
        username: `creator_${freshGuestId.slice(-6)}`,
        passwordHash: "guest_session"
      },
      select: { id: true, email: true, username: true }
    });
    return newGuest;
  } catch (error) {
    console.warn("User session lookup fallback active:", error);
    const fallbackId = targetUserId || `guest_${Date.now()}`;
    return {
      id: fallbackId,
      email: `${fallbackId}@guest.omoji.studio`,
      username: `creator_${fallbackId.slice(-6)}`
    };
  }
}

// lib/memory-store.ts
var globalMemoryStore = globalThis;
if (!globalMemoryStore._omojiMemoryUsers) {
  globalMemoryStore._omojiMemoryUsers = /* @__PURE__ */ new Map();
}
if (!globalMemoryStore._omojiMemoryPacks) {
  globalMemoryStore._omojiMemoryPacks = /* @__PURE__ */ new Map();
}
var memoryUsers = globalMemoryStore._omojiMemoryUsers;
var memoryPacks = globalMemoryStore._omojiMemoryPacks;

// app/api/packs/route.ts
var jsonResponse = (data, init) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
};
async function GET3(req) {
  try {
    const user = await getOrCreateSessionUser(req);
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter");
    let whereClause;
    if (filter === "mine") {
      whereClause = { authorId: user.id };
    } else if (filter === "community") {
      whereClause = { isPublished: true, isPublic: true, NOT: { authorId: user.id } };
    } else {
      if (user.id.startsWith("guest_")) {
        whereClause = { authorId: user.id };
      } else {
        whereClause = {
          OR: [
            { authorId: user.id },
            { isPublished: true, isPublic: true }
          ]
        };
      }
    }
    const packs = await prisma.stickerPack.findMany({
      where: whereClause,
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc"
          }
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
    return jsonResponse({ packs });
  } catch (error) {
    console.warn("Prisma packs query unavailable, falling back to memory store:", error?.message);
    const fallbackPacks = Array.from(memoryPacks.values());
    return jsonResponse({ packs: fallbackPacks });
  }
}
async function POST(req) {
  try {
    const user = await getOrCreateSessionUser(req);
    const contentType = req.headers.get("content-type") || "";
    let packTitle = "Untitled Pack";
    let authorName = user.username || "Sticker Studio Creator";
    let trayIconUrl = "";
    let trayIconFile = null;
    const initialStickers = [];
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      packTitle = formData.get("packTitle") || formData.get("title") || formData.get("name") || "Untitled Pack";
      authorName = formData.get("authorName") || formData.get("creator") || formData.get("publisher") || user.username || "Sticker Studio Creator";
      trayIconFile = formData.get("trayIcon");
      trayIconUrl = formData.get("trayIconUrl") || "";
      const stickerFiles = formData.getAll("stickers");
      stickerFiles.forEach((file, index) => {
        initialStickers.push({ file, slotIndex: index, emojis: ["\u2728"] });
      });
    } else {
      const body = await req.json().catch(() => ({}));
      packTitle = body.title || body.name || body.packTitle || "Untitled Pack";
      authorName = body.publisher || body.creator || body.authorName || user.username || "Sticker Studio Creator";
      trayIconUrl = body.trayIconUrl || "";
    }
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (trayIconFile && hasBlobToken) {
      try {
        const trayFileName = `packs/${user.id}/${Date.now()}_tray.png`;
        const trayBlob = await put(trayFileName, trayIconFile, {
          access: "public",
          contentType: "image/png"
        });
        trayIconUrl = trayBlob.url;
      } catch (blobErr) {
        console.warn("Tray icon blob upload warning:", blobErr);
      }
    }
    if (!trayIconUrl) {
      trayIconUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(packTitle)}`;
    }
    const newPack = await prisma.stickerPack.create({
      data: {
        title: packTitle.trim(),
        publisher: authorName.trim(),
        trayIconUrl,
        authorId: user.id,
        isPublic: true,
        isPublished: true,
        downloadCount: 0
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    const createdStickers = [];
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
            emojis: stk.emojis || ["\u2728"]
          }
        });
        createdStickers.push(record);
      }
    }
    return jsonResponse(
      {
        message: "Sticker pack created successfully!",
        pack: {
          ...newPack,
          stickers: createdStickers
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sticker pack:", error);
    return jsonResponse(
      { error: "Failed to create sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}
async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const packId = searchParams.get("id");
    if (!packId) {
      return jsonResponse({ error: "Pack ID is required." }, { status: 400 });
    }
    await prisma.sticker.deleteMany({
      where: { packId }
    });
    await prisma.stickerPack.delete({
      where: { id: packId }
    });
    return jsonResponse({ message: "Sticker pack deleted successfully", id: packId });
  } catch (error) {
    console.error("Error deleting pack:", error);
    return jsonResponse(
      { error: "Failed to delete sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}

// app/api/packs/[packId]/route.ts
import { put as put2 } from "@vercel/blob";
var jsonResponse2 = (data, init) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
};
async function GET4(req, context) {
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
      return jsonResponse2({ error: "Pack ID is required." }, { status: 400 });
    }
    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc"
          }
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    if (!pack) {
      return jsonResponse2({ error: "Sticker pack not found." }, { status: 404 });
    }
    return jsonResponse2({ pack });
  } catch (error) {
    console.error("Error fetching pack details:", error);
    return jsonResponse2(
      { error: "Failed to fetch pack details.", details: error?.message },
      { status: 500 }
    );
  }
}
async function PUT(req, context) {
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
      return jsonResponse2({ error: "Pack ID is required." }, { status: 400 });
    }
    const contentType = req.headers.get("content-type") || "";
    let title;
    let publisher;
    let trayIconUrl;
    let isPublished;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      if (formData.has("title")) title = formData.get("title").trim();
      if (formData.has("name")) title = formData.get("name").trim();
      if (formData.has("packTitle")) title = formData.get("packTitle").trim();
      if (formData.has("publisher")) publisher = formData.get("publisher").trim();
      if (formData.has("creator")) publisher = formData.get("creator").trim();
      if (formData.has("authorName")) publisher = formData.get("authorName").trim();
      if (formData.has("isPublished")) {
        isPublished = formData.get("isPublished") === "true";
      }
      const trayFile = formData.get("trayIcon");
      if (trayFile && Boolean(process.env.BLOB_READ_WRITE_TOKEN)) {
        try {
          const trayBlob = await put2(
            `packs/${user.id}/${packId}_tray_${Date.now()}.png`,
            trayFile,
            { access: "public", contentType: "image/png" }
          );
          trayIconUrl = trayBlob.url;
        } catch (e) {
          console.warn("Tray upload error:", e);
        }
      } else if (formData.has("trayIconUrl")) {
        trayIconUrl = formData.get("trayIconUrl");
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
        ...title !== void 0 ? { title } : {},
        ...publisher !== void 0 ? { publisher } : {},
        ...trayIconUrl !== void 0 ? { trayIconUrl } : {},
        ...isPublished !== void 0 ? { isPublished } : {}
      },
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc"
          }
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    return jsonResponse2({
      message: "Sticker pack updated successfully.",
      pack: updatedPack
    });
  } catch (error) {
    console.error("Error updating pack:", error);
    return jsonResponse2(
      { error: "Failed to update sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}
async function DELETE2(req, context) {
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
      return jsonResponse2({ error: "Pack ID is required." }, { status: 400 });
    }
    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      select: { id: true, authorId: true, title: true }
    });
    if (!pack) {
      return jsonResponse2({ message: "Sticker pack not found or already deleted.", id: packId }, { status: 200 });
    }
    if (pack.authorId && pack.authorId !== user.id && !user.id.startsWith("admin")) {
      return jsonResponse2(
        { error: "You do not have permission to delete this sticker pack." },
        { status: 403 }
      );
    }
    await prisma.$transaction([
      prisma.sticker.deleteMany({
        where: { packId }
      }),
      prisma.stickerPack.delete({
        where: { id: packId }
      })
    ]);
    return jsonResponse2({ message: "Sticker pack deleted successfully.", id: packId });
  } catch (error) {
    console.error("Error deleting pack:", error);
    return jsonResponse2(
      { error: "Failed to delete sticker pack.", details: error?.message },
      { status: 500 }
    );
  }
}

// app/api/packs/[packId]/stickers/[slotIndex]/route.ts
import { put as put3 } from "@vercel/blob";
var jsonResponse3 = (data, init) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
};
function parseParams(req, context) {
  let packId = context?.params?.packId || "";
  let slotIndex = context?.params?.slotIndex !== void 0 ? parseInt(context.params.slotIndex, 10) : NaN;
  if (!packId || isNaN(slotIndex)) {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const packsIdx = segments.indexOf("packs");
    if (packsIdx !== -1) {
      packId = segments[packsIdx + 1] || "";
      const stickersIdx = segments.indexOf("stickers");
      if (stickersIdx !== -1 && segments[stickersIdx + 1] !== void 0) {
        slotIndex = parseInt(segments[stickersIdx + 1], 10);
      }
    }
  }
  return { packId, slotIndex };
}
async function POST2(req, context) {
  try {
    const user = await getOrCreateSessionUser(req);
    const { packId, slotIndex } = parseParams(req, context);
    if (!packId) {
      return jsonResponse3({ error: "Pack ID is required." }, { status: 400 });
    }
    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 29) {
      return jsonResponse3(
        { error: "Invalid slotIndex. Slot index must be an integer between 0 and 29." },
        { status: 400 }
      );
    }
    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId }
    });
    if (!pack) {
      return jsonResponse3({ error: "Sticker pack not found." }, { status: 404 });
    }
    const contentType = req.headers.get("content-type") || "";
    let imageUrl = "";
    let emojis = ["\u2728"];
    let isAnimated = false;
    let fileSize = 0;
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const stickerEntry = formData.get("sticker") || formData.get("image") || formData.get("file");
      const emojiRaw = formData.get("emojis");
      if (emojiRaw) {
        try {
          emojis = typeof emojiRaw === "string" && emojiRaw.startsWith("[") ? JSON.parse(emojiRaw) : [String(emojiRaw)];
        } catch {
          emojis = [String(emojiRaw)];
        }
      }
      if (formData.has("isAnimated")) {
        isAnimated = formData.get("isAnimated") === "true";
      }
      if (stickerEntry && typeof stickerEntry !== "string") {
        const stickerFile = stickerEntry;
        fileSize = stickerFile.size;
        if (hasBlobToken) {
          const blobRes = await put3(
            `packs/${user.id}/${packId}_slot_${slotIndex}_${Date.now()}.webp`,
            stickerFile,
            { access: "public", contentType: "image/webp" }
          );
          imageUrl = blobRes.url;
        } else {
          const arrayBuf = await stickerFile.arrayBuffer();
          const base64 = Buffer.from(arrayBuf).toString("base64");
          imageUrl = `data:image/webp;base64,${base64}`;
        }
      } else if (formData.has("imageUrl")) {
        imageUrl = formData.get("imageUrl");
      }
    } else {
      const body = await req.json().catch(() => ({}));
      imageUrl = body.imageUrl || body.url || body.webpUrl || "";
      if (Array.isArray(body.emojis)) emojis = body.emojis;
      if (typeof body.isAnimated === "boolean") isAnimated = body.isAnimated;
      if (typeof body.fileSize === "number") fileSize = body.fileSize;
    }
    if (!imageUrl) {
      return jsonResponse3(
        { error: "A valid sticker image file or imageUrl is required." },
        { status: 400 }
      );
    }
    if (hasBlobToken && imageUrl.startsWith("data:")) {
      try {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1] || "image/webp";
          const ext = mimeType.includes("gif") ? "gif" : mimeType.includes("png") ? "png" : "webp";
          const buffer = Buffer.from(matches[2], "base64");
          fileSize = buffer.length;
          const blobRes = await put3(
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
    const sticker = await prisma.sticker.upsert({
      where: {
        packId_slotIndex: {
          packId,
          slotIndex
        }
      },
      update: {
        imageUrl,
        emojis,
        isAnimated,
        fileSize,
        order: slotIndex + 1,
        updatedAt: /* @__PURE__ */ new Date()
      },
      create: {
        packId,
        slotIndex,
        order: slotIndex + 1,
        imageUrl,
        emojis,
        isAnimated,
        fileSize
      }
    });
    const updatedPack = await prisma.stickerPack.update({
      where: { id: packId },
      data: {
        updatedAt: /* @__PURE__ */ new Date(),
        ...!pack.trayIconUrl || pack.trayIconUrl.includes("dicebear") ? { trayIconUrl: imageUrl } : {}
      },
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc"
          }
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    return jsonResponse3(
      {
        message: `Sticker successfully saved to slot ${slotIndex + 1}!`,
        sticker,
        pack: updatedPack
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error committing sticker to slot:", error);
    return jsonResponse3(
      { error: "Failed to save sticker to slot.", details: error?.message },
      { status: 500 }
    );
  }
}
async function DELETE3(req, context) {
  try {
    const { packId, slotIndex } = parseParams(req, context);
    if (!packId) {
      return jsonResponse3({ error: "Pack ID is required." }, { status: 400 });
    }
    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 29) {
      return jsonResponse3(
        { error: "Invalid slotIndex. Must be between 0 and 29." },
        { status: 400 }
      );
    }
    await prisma.sticker.deleteMany({
      where: {
        packId,
        slotIndex
      }
    });
    const updatedPack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      include: {
        stickers: {
          orderBy: {
            slotIndex: "asc"
          }
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    return jsonResponse3({
      message: `Sticker cleared from slot ${slotIndex + 1}.`,
      pack: updatedPack,
      slotIndex
    });
  } catch (error) {
    console.error("Error removing sticker from slot:", error);
    return jsonResponse3(
      { error: "Failed to clear sticker from slot.", details: error?.message },
      { status: 500 }
    );
  }
}

// app/api/auth/register/route.ts
import bcrypt from "bcryptjs";
var jsonResponse4 = (data, init) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
};
async function POST3(req) {
  try {
    const body = await req.json();
    const { email, username, password } = body;
    if (!email || !username || !password) {
      return jsonResponse4(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    if (password.length < 6) {
      return jsonResponse4(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return jsonResponse4(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    for (const memUser of memoryUsers.values()) {
      if (memUser.email === cleanEmail) {
        return jsonResponse4(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      if (memUser.username === cleanUsername) {
        return jsonResponse4(
          { error: "This username is already claimed." },
          { status: 409 }
        );
      }
    }
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername }
        ]
      }
    }).catch((err) => {
      console.warn("Prisma findFirst warning, proceeding:", err?.message);
      return null;
    });
    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return jsonResponse4(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return jsonResponse4(
        { error: "This username is already claimed." },
        { status: 409 }
      );
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    let newUser;
    try {
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          passwordHash
        }
      });
    } catch (createErr) {
      if (createErr.code === "P2002") {
        const target = createErr.meta?.target || [];
        const isEmail = target.some((t) => t.includes("email"));
        return jsonResponse4(
          { error: isEmail ? "An account with this email already exists." : "This username is already claimed." },
          { status: 409 }
        );
      }
      console.warn("Prisma user creation unavailable, falling back to memory store:", createErr?.message);
      const fallbackId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const memUser = {
        id: fallbackId,
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
        createdAt: /* @__PURE__ */ new Date()
      };
      memoryUsers.set(fallbackId, memUser);
      newUser = memUser;
    }
    return jsonResponse4(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          createdAt: newUser.createdAt
        },
        token: newUser.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return jsonResponse4(
      { error: error?.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}

// app/api/auth/login/route.ts
import bcrypt2 from "bcryptjs";
var jsonResponse5 = (data, init) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
};
async function POST4(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = (body.email || body.username || body.identifier || "").trim().toLowerCase();
    const password = body.password || "";
    if (!identifier || !password) {
      return jsonResponse5(
        { error: "Please provide your email/username and password." },
        { status: 400 }
      );
    }
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    }).catch((err) => {
      console.warn("Prisma query error in /api/auth/login:", err?.message);
      return null;
    });
    if (!user) {
      for (const memUser of memoryUsers.values()) {
        if (memUser.email.toLowerCase() === identifier || memUser.username.toLowerCase() === identifier) {
          user = memUser;
          break;
        }
      }
    }
    if (!user) {
      return jsonResponse5(
        { error: "No account found with this email or username." },
        { status: 401 }
      );
    }
    if (!user.passwordHash) {
      return jsonResponse5(
        { error: "Invalid account configuration. Please reset your credentials." },
        { status: 401 }
      );
    }
    const isPasswordValid = await bcrypt2.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return jsonResponse5(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt
    };
    return jsonResponse5(
      {
        message: "Login successful",
        user: safeUser,
        token: user.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login route error:", error);
    return jsonResponse5(
      { error: error?.message || "Internal server error during authentication." },
      { status: 500 }
    );
  }
}

// app/api/auth/me/route.ts
var jsonResponse6 = (data, init) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
};
async function GET5(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const userIdHeader = req.headers.get("x-user-id");
    let userId = userIdHeader;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      userId = authHeader.substring(7);
    }
    if (!userId || userId === "null" || userId === "undefined") {
      return jsonResponse6({ error: "Unauthorized" }, { status: 401 });
    }
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    }).catch(() => null);
    if (!user && memoryUsers.has(userId)) {
      const mem = memoryUsers.get(userId);
      user = {
        id: mem.id,
        email: mem.email,
        username: mem.username,
        createdAt: mem.createdAt
      };
    }
    if (!user) {
      return jsonResponse6({ error: "User session not found" }, { status: 404 });
    }
    return jsonResponse6({ user }, { status: 200 });
  } catch (error) {
    return jsonResponse6(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// app/api/auth/[...nextauth]/route.ts
import bcrypt3 from "bcryptjs";
async function GET6(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.includes("/session")) {
    const authHeader = request.headers.get("authorization");
    const userIdHeader = request.headers.get("x-user-id");
    let userId = userIdHeader;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      userId = authHeader.substring(7);
    }
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, createdAt: true }
      }).catch(() => null);
      if (user) {
        return new Response(JSON.stringify({ user, expires: new Date(Date.now() + 30 * 864e5).toISOString() }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (path.includes("/csrf")) {
    return new Response(JSON.stringify({ csrfToken: "omoji_csrf_token_" + Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (path.includes("/providers")) {
    return new Response(
      JSON.stringify({
        credentials: {
          id: "credentials",
          name: "Credentials",
          type: "credentials",
          signinUrl: "/api/auth/signin/credentials",
          callbackUrl: "/api/auth/callback/credentials"
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify({ status: "NextAuth Endpoint Ready" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function POST5(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = (body.identifier || body.email || body.username || "").trim().toLowerCase();
    const password = body.password || "";
    if (!identifier || !password) {
      return new Response(
        JSON.stringify({ error: "Missing email/username or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    }).catch(() => null);
    if (!user || !user.passwordHash) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const isValid = await bcrypt3.compare(password, user.passwordHash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt
        },
        token: user.id,
        url: "/"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// server-app.ts
async function adaptWebHandler(handler2, req, res) {
  try {
    let protocol = "https";
    if (req.headers && req.headers["x-forwarded-proto"]) {
      const xfp = req.headers["x-forwarded-proto"];
      protocol = Array.isArray(xfp) ? xfp[0] : xfp.split(",")[0].trim();
    } else if (req.socket && req.socket.encrypted) {
      protocol = "https";
    } else {
      protocol = "http";
    }
    const host = req.headers && req.headers.host || "localhost:3000";
    const rawUrl = req.originalUrl || req.url || "/";
    const fullUrl = `${protocol}://${host}${rawUrl}`;
    const headers = new Headers();
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== void 0 && value !== null) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v);
          } else {
            headers.set(key, value);
          }
        }
      }
    }
    const init = {
      method: req.method || "GET",
      headers
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        init.body = req.body;
        init.duplex = "half";
      } else if (typeof req.body === "string" && req.body.length > 0) {
        init.body = Buffer.from(req.body);
        init.duplex = "half";
      } else if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
        init.body = JSON.stringify(req.body);
        init.duplex = "half";
      }
    }
    const webReq = new Request(fullUrl, init);
    const webRes = await handler2(webReq);
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const arrayBuffer = await webRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Express web handler bridge error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal Server Error" });
    }
  }
}
function createExpressApp() {
  const app2 = express();
  app2.use("/api", express.raw({ type: "*/*", limit: "100mb" }));
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app2.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    next();
  });
  const apiRouter = express.Router();
  apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  apiRouter.get("/search/giphy", (req, res) => {
    return adaptWebHandler(GET, req, res);
  });
  apiRouter.options("/proxy-image", (req, res) => {
    return adaptWebHandler(OPTIONS, req, res);
  });
  apiRouter.get("/proxy-image", (req, res) => {
    return adaptWebHandler(GET2, req, res);
  });
  apiRouter.post("/packs/:packId/stickers/:slotIndex", (req, res) => {
    return adaptWebHandler((r) => POST2(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }), req, res);
  });
  apiRouter.delete("/packs/:packId/stickers/:slotIndex", (req, res) => {
    return adaptWebHandler((r) => DELETE3(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }), req, res);
  });
  apiRouter.get("/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => GET4(r, { params: { packId: req.params.packId } }), req, res);
  });
  apiRouter.put("/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => PUT(r, { params: { packId: req.params.packId } }), req, res);
  });
  apiRouter.patch("/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => PUT(r, { params: { packId: req.params.packId } }), req, res);
  });
  apiRouter.delete("/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => DELETE2(r, { params: { packId: req.params.packId } }), req, res);
  });
  apiRouter.get("/packs", (req, res) => {
    return adaptWebHandler(GET3, req, res);
  });
  apiRouter.post("/packs", (req, res) => {
    return adaptWebHandler(POST, req, res);
  });
  apiRouter.delete("/packs", (req, res) => {
    return adaptWebHandler(DELETE, req, res);
  });
  apiRouter.post("/auth/register", (req, res) => {
    return adaptWebHandler(POST3, req, res);
  });
  apiRouter.post("/auth/login", (req, res) => {
    return adaptWebHandler(POST4, req, res);
  });
  apiRouter.get("/auth/me", (req, res) => {
    return adaptWebHandler(GET5, req, res);
  });
  apiRouter.get("/auth/session", (req, res) => {
    return adaptWebHandler(GET5, req, res);
  });
  apiRouter.get("/auth/*", (req, res) => {
    return adaptWebHandler(GET6, req, res);
  });
  apiRouter.post("/auth/*", (req, res) => {
    return adaptWebHandler(POST5, req, res);
  });
  app2.use("/api", apiRouter);
  app2.use(apiRouter);
  return app2;
}
var app = createExpressApp();
function handler(req, res) {
  return app(req, res);
}
export {
  adaptWebHandler,
  app,
  createExpressApp,
  handler as default
};
