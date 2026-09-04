import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import Next.js App Router API handlers
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
async function adaptWebHandler(
  handler: (req: Request) => Promise<Response>,
  req: express.Request,
  res: express.Response
) {
  try {
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares: preserve raw buffer for all API endpoints to support multipart FormData & JSON
  app.use("/api", express.raw({ type: "*/*", limit: "100mb" }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Cross-Origin headers for WebWorkers and WebAssembly
  app.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    next();
  });

  // API Routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Giphy Search API Proxy
  app.get("/api/search/giphy", (req, res) => {
    return adaptWebHandler(getGiphySearch, req, res);
  });

  // CORS Image Proxy
  app.options("/api/proxy-image", (req, res) => {
    return adaptWebHandler(optionsProxyImage, req, res);
  });
  app.get("/api/proxy-image", (req, res) => {
    return adaptWebHandler(getProxyImage, req, res);
  });

  // Sticker Packs API
  // 1. Slot Sticker API
  app.post("/api/packs/:packId/stickers/:slotIndex", (req, res) => {
    return adaptWebHandler((r) => postSlotSticker(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }), req, res);
  });
  app.delete("/api/packs/:packId/stickers/:slotIndex", (req, res) => {
    return adaptWebHandler((r) => deleteSlotSticker(r, { params: { packId: req.params.packId, slotIndex: req.params.slotIndex } }), req, res);
  });

  // 2. Single Pack by ID API
  app.get("/api/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => getPackById(r, { params: { packId: req.params.packId } }), req, res);
  });
  app.put("/api/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => putPackById(r, { params: { packId: req.params.packId } }), req, res);
  });
  app.patch("/api/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => putPackById(r, { params: { packId: req.params.packId } }), req, res);
  });
  app.delete("/api/packs/:packId", (req, res) => {
    return adaptWebHandler((r) => deletePackById(r, { params: { packId: req.params.packId } }), req, res);
  });

  // 3. Packs Collection API
  app.get("/api/packs", (req, res) => {
    return adaptWebHandler(getPacks, req, res);
  });
  app.post("/api/packs", (req, res) => {
    return adaptWebHandler(postPacks, req, res);
  });
  app.delete("/api/packs", (req, res) => {
    return adaptWebHandler(deletePacks, req, res);
  });

  // Auth routes
  app.post("/api/auth/register", (req, res) => {
    return adaptWebHandler(postRegister, req, res);
  });
  app.post("/api/auth/login", (req, res) => {
    return adaptWebHandler(postLogin, req, res);
  });
  app.get("/api/auth/me", (req, res) => {
    return adaptWebHandler(getMe, req, res);
  });
  app.get("/api/auth/session", (req, res) => {
    return adaptWebHandler(getMe, req, res);
  });
  app.get("/api/auth/*", (req, res) => {
    return adaptWebHandler(getNextAuth, req, res);
  });
  app.post("/api/auth/*", (req, res) => {
    return adaptWebHandler(postNextAuth, req, res);
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
