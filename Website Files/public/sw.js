/* Vortex PCs Service Worker - basic offline caching */
const VERSION = "v1.0.0";
const STATIC_CACHE = `vortex-static-${VERSION}`;
const PAGES_CACHE = `vortex-pages-${VERSION}`;
const IMAGES_CACHE = `vortex-images-${VERSION}`;
const API_CACHE = `vortex-api-${VERSION}`;

// Cache size limits to prevent storage bloat
const CACHE_LIMITS = {
  [STATIC_CACHE]: 50,
  [PAGES_CACHE]: 30,
  [IMAGES_CACHE]: 100,
  [API_CACHE]: 50,
};

// Precache a small set of core assets (hash-less paths only)
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/vortexpcs-logo.png",
  "/robots.txt",
  "/sitemap.xml",
  "/version.json",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  // Activate new SW immediately
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  // Claim clients right away and clean old caches
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (
            key !== STATIC_CACHE &&
            key !== PAGES_CACHE &&
            key !== IMAGES_CACHE &&
            key !== API_CACHE
          ) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
      // Broadcast a message so the app can prompt user to refresh
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED", version: VERSION });
      }
    })()
  );
});

// Allow the page to request immediate activation of the waiting SW
self.addEventListener("message", (event) => {
  if (event && event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Trim cache to size limit (FIFO - oldest entries removed first)
async function trimCache(cacheName, maxItems) {
  if (!maxItems) return;
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
      const keysToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    }
  } catch (e) {
    // Silently fail if cache operations not supported
  }
}

function isHtmlRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}

function isSameOrigin(url) {
  try {
    const u = new URL(url, self.location.href);
    return u.origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache Stripe, Firebase, or other sensitive endpoints
  if (
    /stripe|paypal|accounts\.google|firebase|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/i.test(
      url.hostname
    )
  ) {
    return; // default network behavior
  }

  // Network-first for HTML navigations
  if (isHtmlRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          const cache = await caches.open(PAGES_CACHE);
          cache.put(request, network.clone());
          await trimCache(PAGES_CACHE, CACHE_LIMITS[PAGES_CACHE]);
          return network;
        } catch (err) {
          const cache = await caches.open(PAGES_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          // Fallback to cached index if available (SPA)
          const index = await caches.match("/index.html");
          if (index) return index;
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        }
      })()
    );
    return;
  }

  // Static assets (scripts, styles, workers) - stale-while-revalidate
  if (
    isSameOrigin(request.url) &&
    ["script", "style", "worker"].includes(request.destination)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((resp) => {
            if (resp.ok) {
              cache.put(request, resp.clone());
              trimCache(STATIC_CACHE, CACHE_LIMITS[STATIC_CACHE]);
            }
            return resp;
          })
          .catch(() => undefined);
        return cached || networkPromise || fetch(request);
      })()
    );
    return;
  }

  // Images - cache-first
  if (request.destination === "image") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGES_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const network = await fetch(request, {
            mode: request.mode,
            credentials: request.credentials,
          });
          if (network.ok) {
            cache.put(request, network.clone());
            await trimCache(IMAGES_CACHE, CACHE_LIMITS[IMAGES_CACHE]);
          }
          return network;
        } catch (e) {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // API calls (same-origin /api or CMS) - network-first with fallback
  if (isSameOrigin(request.url) && url.pathname.startsWith("/api")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        try {
          const network = await fetch(request);
          // Only cache successful GET responses for API calls
          if (network.ok && request.method === "GET") {
            cache.put(request, network.clone());
            await trimCache(API_CACHE, CACHE_LIMITS[API_CACHE]);
          }
          return network;
        } catch (e) {
          const cached = await cache.match(request);
          if (cached) {
            // Add header to indicate this is a cached response
            const headers = new Headers(cached.headers);
            headers.set("X-Cache-Status", "HIT");
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers: headers,
            });
          }
          return new Response(JSON.stringify({ error: "Offline" }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
          });
        }
      })()
    );
    return;
  }

  // Default: try network, then fall back to cache
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw e;
      }
    })()
  );
});
