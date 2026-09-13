/**
 * Omoji Sticker Studio PWA Service Worker (v2)
 * Provides offline caching, lightning-fast app shell loads, and reliable offline drafts editing.
 */

const CACHE_NAME = "omoji-sticker-studio-v2";

const STATIC_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
];

// Install Event: Precache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_PRECACHE).catch((err) => {
          console.warn("[SW] Some assets failed to precache:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup Old Caches & Claim Clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate with Offline Fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser-extension requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Bypass dev mode requests, Vite runtime modules, and source files completely
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.includes("/node_modules/") ||
    url.pathname.includes("/src/") ||
    url.pathname.includes("/components/") ||
    url.pathname.includes("/utils/") ||
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".ts") ||
    url.hostname.includes("run.app") ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  ) {
    // Let browser network handle directly without Service Worker caching
    return;
  }

  // API calls: Network-First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: "You are currently offline. Please reconnect to access the online database.",
            offline: true,
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // Static Assets & Production Bundles: Stale-While-Revalidate with MIME type protection
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get("content-type") || "";
            const isScript = url.pathname.endsWith(".js") || request.destination === "script";

            // Guard against caching HTML (such as 404 fallbacks) as scripts/modules
            if (isScript && contentType.includes("text/html")) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return index.html
          if (request.mode === "navigate") {
            return caches.match("/index.html") || caches.match("/");
          }
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
