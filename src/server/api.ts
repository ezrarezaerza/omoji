import "dotenv/config";
import express from "express";

// Import Next.js App Router API handlers
import { GET as getGiphySearch } from "../../app/api/search/giphy/route";
import { GET as getProxyImage, OPTIONS as optionsProxyImage } from "../../app/api/proxy-image/route";
import { GET as getPacks, POST as postPacks, DELETE as deletePacks } from "../../app/api/packs/route";
import {
  GET as getPackById,
  PUT as putPackById,
  DELETE as deletePackById,
} from "../../app/api/packs/[packId]/route";
import { GET as getWhatsAppManifest } from "../../app/api/packs/[packId]/whatsapp-manifest/route";
import {
  POST as postSlotSticker,
  DELETE as deleteSlotSticker,
} from "../../app/api/packs/[packId]/stickers/[slotIndex]/route";
import { POST as postRegister } from "../../app/api/auth/register/route";
import { POST as postLogin } from "../../app/api/auth/login/route";
import { GET as getMe } from "../../app/api/auth/me/route";
import { GET as getNextAuth, POST as postNextAuth } from "../../app/api/auth/[...nextauth]/route";
import { POST as postRemoveBackground } from "../../app/api/ai/remove-background/route";

// Helper to adapt standard Web Request/Response route handlers to Express
export async function adaptWebHandler(
  handler: (req: Request) => Promise<Response>,
  req: express.Request,
  res: express.Response
) {
  try {
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    const host = req.get("host") || "localhost:3000";
    const originalUrl = req.originalUrl || req.url || "/";
    const fullUrl = `${protocol}://${host}${originalUrl}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const init: RequestInit & { duplex?: string } = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        init.body = req.body;
        init.duplex = "half";
      } else if (typeof req.body === "string" && req.body.length > 0) {
        init.body = Buffer.from(req.body);
        init.duplex = "half";
      } else if (req.body && typeof req.body === "object") {
        init.body = JSON.stringify(req.body);
        init.duplex = "half";
      }
    }

    const webReq = new Request(fullUrl, init);
    const webRes = await handler(webReq);

    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await webRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Express web handler bridge error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal Server Error" });
    }
  }
}

// Instantiate Express Application
export const app = express();

// Middlewares: preserve raw buffer for all API endpoints to support multipart FormData & JSON
app.use(express.raw({ type: ["application/octet-stream", "multipart/form-data"], limit: "100mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cross-Origin headers
app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Create API Router
export const apiRouter = express.Router();

// Health Check
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
});

// Giphy Search API Proxy
apiRouter.get("/search/giphy", (req, res) => {
  return adaptWebHandler(getGiphySearch, req, res);
});

// CORS Image Proxy
apiRouter.options("/proxy-image", (req, res) => {
  return adaptWebHandler(optionsProxyImage, req, res);
});
apiRouter.get("/proxy-image", (req, res) => {
  return adaptWebHandler(getProxyImage, req, res);
});

// AI Background Removal
apiRouter.post("/ai/remove-background", (req, res) => {
  return adaptWebHandler(postRemoveBackground, req, res);
});

// Sticker Packs API
// 1. Slot Sticker API
apiRouter.post("/packs/:packId/stickers/:slotIndex", (req, res) => {
  return adaptWebHandler(
    (r) => postSlotSticker(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }),
    req,
    res
  );
});
apiRouter.delete("/packs/:packId/stickers/:slotIndex", (req, res) => {
  return adaptWebHandler(
    (r) => deleteSlotSticker(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }),
    req,
    res
  );
});

// 2. WhatsApp Official Sticker Provider Manifest & Diagnostics API
apiRouter.get("/packs/:packId/whatsapp-manifest", (req, res) => {
  return adaptWebHandler((r) => getWhatsAppManifest(r, { params: { packId: req.params.packId } }), req, res);
});

// 3. Single Pack by ID API
apiRouter.get("/packs/:packId", (req, res) => {
  return adaptWebHandler((r) => getPackById(r, { params: { packId: req.params.packId } }), req, res);
});
apiRouter.put("/packs/:packId", (req, res) => {
  return adaptWebHandler((r) => putPackById(r, { params: { packId: req.params.packId } }), req, res);
});
apiRouter.patch("/packs/:packId", (req, res) => {
  return adaptWebHandler((r) => putPackById(r, { params: { packId: req.params.packId } }), req, res);
});
apiRouter.delete("/packs/:packId", (req, res) => {
  return adaptWebHandler((r) => deletePackById(r, { params: { packId: req.params.packId } }), req, res);
});

// 3. Packs Collection API
apiRouter.get("/packs", (req, res) => {
  return adaptWebHandler(getPacks, req, res);
});
apiRouter.post("/packs", (req, res) => {
  return adaptWebHandler(postPacks, req, res);
});
apiRouter.delete("/packs", (req, res) => {
  return adaptWebHandler(deletePacks, req, res);
});

// Auth routes
apiRouter.post("/auth/register", (req, res) => {
  return adaptWebHandler(postRegister, req, res);
});
apiRouter.post("/auth/login", (req, res) => {
  return adaptWebHandler(postLogin, req, res);
});
apiRouter.get("/auth/me", (req, res) => {
  return adaptWebHandler(getMe, req, res);
});
apiRouter.get("/auth/session", (req, res) => {
  return adaptWebHandler(getMe, req, res);
});
apiRouter.get("/auth/*", (req, res) => {
  return adaptWebHandler(getNextAuth, req, res);
});
apiRouter.post("/auth/*", (req, res) => {
  return adaptWebHandler(postNextAuth, req, res);
});

// Mount the API Router to BOTH "/api" and "/"
// This ensures that whether Vercel rewrites keep the /api prefix or strip it,
// all endpoints will match and respond with 200 OK instead of 404.
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Default export for Vercel Serverless Function handler
export default app;
