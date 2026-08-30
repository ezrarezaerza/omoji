import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import Next.js App Router API handlers
import { GET as getGiphySearch } from "./app/api/search/giphy/route";
import { GET as getProxyImage, OPTIONS as optionsProxyImage } from "./app/api/proxy-image/route";
import { GET as getPacks, POST as postPacks } from "./app/api/packs/route";
import { POST as postRegister } from "./app/api/auth/register/route";
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

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body) {
        init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
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

  // Middlewares
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
  app.get("/api/packs", (req, res) => {
    return adaptWebHandler(getPacks, req, res);
  });
  app.post("/api/packs", (req, res) => {
    return adaptWebHandler(postPacks, req, res);
  });

  // Auth routes
  app.post("/api/auth/register", (req, res) => {
    return adaptWebHandler(postRegister, req, res);
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
