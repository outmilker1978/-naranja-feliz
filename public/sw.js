/* PWA service worker — safe caching.
   Lessons learned (v4→v5):
   - NEVER clone/cache responses that Next.js streams (RSC payloads, streamed
     SSR pages): grabbing a copy locks the body of the Response we then hand
     back, and Chrome aborts with "a Response whose body is locked cannot be
     used to respond to a request".
   - NEVER time out navigations with a small budget: a cold Serverless
     container boots in tens of seconds; a 15s timeout made the SW fabricate
     "503 Offline" for healthy pages.
   Only hashed static assets (_next/static/*) are cached (immutable names,
     non-streaming). Everything else is a transparent pass-through so the
     network is the single source of truth, with a plain 503 only on real
     network failures. */
const CACHE = "nf-v5";

const OFFLINE = new Response("Нет соединения", {
  status: 503,
  statusText: "Offline",
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});

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

  // Streaming media through the storage proxy (and its signed-URL redirect to
  // Supabase): never intercept. Range/206 responses can't be cloned/cached by a
  // Service Worker (breaks seeking/playback), and a hung upstream must surface
  // to the player, not the SW 503 shell.
  if (url.origin === location.origin && url.pathname.startsWith("/api/storage/")) {
    event.respondWith(fetch(req).catch(() => OFFLINE));
    return;
  }

  // Next.js static build assets — immutable hashed filenames, non-streaming and
  // safe to cache-first. Everything read to its end before caching.
  if (url.origin === location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => OFFLINE)
    );
    return;
  }

  // Everything else (page navigations, Next RSC payloads, JSON APIs): plain
  // pass-through to the network. No timeout, no cloning, no response caching —
  // a cold container just takes a few seconds and the tab keeps waiting
  // instead of failing. Offline → cached shell for the root, else 503.
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match("/");
        return cached || OFFLINE;
      })
    );
    return;
  }
});