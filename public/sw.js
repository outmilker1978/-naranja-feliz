/* PWA service worker — safe caching:
   - Hashed static assets (_next/static/*) -> cache-first (immutable names).
   - Navigations -> network-first with a hard timeout (a cold/hung server must
     never leave the tab spinner spinning forever); offline fallback to the
     cached shell, else a plain 503.
   - Everything else -> cache-first, revalidate in background with timeout.
   Never responds with `undefined` (which made Chrome throw
   "Failed to convert value to 'Response'" and kept the favicon spinner alive).
   Only successful (ok) network responses are cached. */
const CACHE = "nf-v3";

const FETCH_TIMEOUT_MS = 15000;
const OFFLINE = new Response("Нет соединения", {
  status: 503,
  statusText: "Offline",
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("sw-fetch-timeout")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Streaming media though the storage proxy: never intercept. Range/206 responses
  // cannot be cloned/cached by a Service Worker (breaks seeking and playback), and a
  // hung upstream must surface to the <audio>/<video> element, not the SW 503 shell.
  if (url.origin === location.origin && url.pathname.startsWith("/api/storage/")) {
    event.respondWith(fetch(req));
    return;
  }

  // Next.js static build assets — immutable hashed filenames, safe to cache-first.
  if (url.origin === location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return withTimeout(fetch(req), FETCH_TIMEOUT_MS).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigations — always try network first (fresh content), bounded by a timeout
  // so a slow server never freezes the tab. Offline -> cached shell, else 503.
  if (req.mode === "navigate") {
    event.respondWith(
      withTimeout(fetch(req), FETCH_TIMEOUT_MS)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          return cached || OFFLINE;
        })
    );
    return;
  }

  // Other same-origin GETs — cache-first, background revalidate with timeout.
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return withTimeout(fetch(req), FETCH_TIMEOUT_MS)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => OFFLINE);
      })
    );
  }
});