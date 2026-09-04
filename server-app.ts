import "dotenv/config";
import express from "express";
import { GET as getGiphySearch } from "./app/api/search/giphy/route";
import { GET as getProxyImage, OPTIONS as optionsProxyImage } from "./app/api/proxy-image/route";
import { GET as getPacks, POST as postPacks, DELETE as deletePacks } from "./app/api/packs/route";
import {
  GET as getPackById,
  PUT as putPackById,
  DELETE as deletePackById,
} from "./app/api/packs/[packId]/route";
import {
  POST as postSlotSticker,
  DELETE as deleteSlotSticker,
} from "./app/api/packs/[packId]/stickers/[slotIndex]/route";
import { POST as postRegister } from "./app/api/auth/register/route";
import { POST as postLogin } from "./app/api/auth/login/route";
import { GET as getMe } from "./app/api/auth/me/route";
import { GET as getNextAuth, POST as postNextAuth } from "./app/api/auth/[...nextauth]/route";

// Helper to adapt standard Web Request/Response route handlers to Express
export async function adaptWebHandler(
  handler: (req: Request) => Promise<Response>,
  req: express.Request,
  res: express.Response
) {
  try {
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;

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
      } else if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
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

export function createExpressApp(): express.Express {
  const app = express();

  // Middlewares: raw buffer for all API endpoints to support multipart FormData & JSON
  app.use("/api", express.raw({ type: "*/*", limit: "100mb" }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Cross-Origin headers for WebWorkers and WebAssembly
  app.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    next();
  });

  // Create an API router so routes work whether accessed with /api prefix or without (Vercel rewrite robustness)
  const apiRouter = express.Router();

  apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok" });
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

  // Slot Sticker API
  apiRouter.post("/packs/:packId/stickers/:slotIndex", (req, res) => {
    return adaptWebHandler((r) => postSlotSticker(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }), req, res);
  });
  apiRouter.delete("/packs/:packId/stickers/:slotIndex", (req, res) => {
    return adaptWebHandler((r) => deleteSlotSticker(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }), req, res);
  });

  // Single Pack by ID API
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

  // Packs Collection API
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

  // Mount at both /api and root level to handle any Vercel URL rewrite variance
  app.use("/api", apiRouter);
  app.use(apiRouter);

  return app;
}

export default createExpressApp;
