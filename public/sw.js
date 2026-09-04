/**
 * Omoji Sticker Studio PWA Service Worker
 * Provides offline caching, lightning-fast app shell loads, and reliable offline drafts editing.
 */

const CACHE_NAME = "omoji-sticker-studio-v1";

const STATIC_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
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

  // API calls: Network-First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: "You are currently offline. Operations are queued locally in your IndexedDB drafts.",
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

  // Fonts and Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
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
