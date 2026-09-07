import { NextResponse } from "next/server";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import sharp from "sharp";

const SUPABASE_URL = "https://zphehhzgbudetyzezunk.supabase.co";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
};

// Max pixels for safety against DoS. Sharp can be CPU-heavy on huge images.
const MAX_DIM = 2560;

// Simple in-memory cache: process each image URL once, serve repeats from memory.
// Serverless containers are ephemeral but keep warm between requests down to
// seconds, so repeat visits (back/forward, chats, lists) skip sharp+fetch entirely.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { buf: Buffer; mime: string; vary: boolean; ts: number }>();

function cacheGet(key: string) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit;
}

const MEDIA_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "mp4", "webm", "ogv"]);

// Yandex Serverless Containers kill any response whose entity is larger than
// 3,670,016 B (~3.5 MB) with JobResponseTooLong -> 502 / unexpected EOF / blank
// page for the browser. Non-image files (audio/video/pdf) must therefore NEVER
// be proxied whole: each response is capped to one slice (which we align to the
// client's range). Media elements + PDF viewers continue with small Range
// requests, so playback/seeking works exactly like a static file server.
const MAX_MEDIA_SLICE = 1024 * 1024;

// Hard cap for responses served whole as 200. Must stay well under the Yandex
// entity limit (3,670,016 B): we keep a comfortable margin.
const MAX_FULL_RESPONSE = 3_400_000;

const mediaInflight = new Set<string>();

let lastStage = "init";

// Fetch one range slice with node's own http client. The Next-patched fetch
// chokes on upstream Range responses ("TypeError: terminated"), so media is
// read here instead. Returns the slice bytes + total size from Content-Range.
function rawGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 30000,
): Promise<{
  ok: boolean;
  statusCode: number;
  statusText: string;
  headers: Record<string, string | string[] | undefined>;
  buffer: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.request(
      {
        method: "GET",
        hostname: u.hostname,
        port: u.port || (u.protocol === "http:" ? 80 : 443),
        path: `${u.pathname}${u.search}`,
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "identity",
          "User-Agent": "NaranjaFeliz/1.0",
          "X-Client-Info": "node-https/1.0",
          Connection: "close",
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("error", (e) => reject(e));
        res.on("end", () => {
          resolve({
            ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers: res.headers as Record<string, string | string[] | undefined>,
            buffer: Buffer.concat(chunks),
          });
        });
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("upstream timeout")));
    req.on("error", (e) => reject(e));
    req.end();
  });
}

async function rawGetRetryFull(url: string, headers: Record<string, string>, attempts = 5) {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await rawGet(url, headers);
      if (!res.ok) throw new Error(`upstream ${res.statusCode} ${res.statusText}`);
      return res;
    } catch (e) {
      lastErr = e as Error;
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr ?? new Error("upstream fetch failed");
}

async function rawGetRetry(url: string, headers: Record<string, string>, start: number, end: number, attempts = 5) {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await rawGet(url, { ...headers, Range: `bytes=${start}-${end}` });
      if (!res.ok) throw new Error(`slice ${start}-${end}: ${res.statusCode} ${res.statusText}`);
      return res;
    } catch (e) {
      lastErr = e as Error;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw lastErr ?? new Error("slice fetch failed");
}

function parseTotal(contentRange: string | string[] | undefined): number {
  const m = /bytes \d+-\d+\/(\d+)/.exec(Array.isArray(contentRange) ? contentRange[0] ?? "" : contentRange ?? "");
  return m ? Number.parseInt(m[1], 10) : -1;
}

// Cap concurrent image pipelines: sharp on a 1 vCPU / 1 GB container plus a few
// cold upstream fetches at once stalls everything and the gateway answers with
// 502 bursts. Images are also cached, so this mostly matters for the first hit.
let imageSlots = 3;
const imageQueue: Array<() => void> = [];
function acquireImageSlot(): Promise<void> {
  if (imageSlots > 0) {
    imageSlots--;
    return Promise.resolve();
  }
  return new Promise((resolve) => imageQueue.push(resolve));
}
function releaseImageSlot() {
  const next = imageQueue.shift();
  if (next) next();
  else imageSlots++;
}

// Issue a Supabase signed URL with a single REST call (anon key). Deliberately
// avoids the supabase-js client (its createSignedUrl was failing inside the
// container) — this proven call works with the "apikey" + Bearer pair.
function rawPostSign(bucket: string, objectPath: string, expiresIn = 21600): Promise<string | null> {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const body = JSON.stringify({ expiresIn });
  return new Promise((resolve) => {
    const u = new URL(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${objectPath}`);
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.request(
      {
        method: "POST",
        hostname: u.hostname,
        port: u.port || (u.protocol === "http:" ? 80 : 443),
        path: `${u.pathname}${u.search}`,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "apikey": anon,
          "Authorization": `Bearer ${anon}`,
          "Connection": "close",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            resolve(typeof json.signedURL === "string" ? json.signedURL : null);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.setTimeout(15000, () => req.destroy(new Error("sign timeout")));
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });
}

function parseQuality(q: string | null, fallback: number): number {
  if (!q) return fallback;
  const n = Number.parseInt(q, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(100, Math.max(1, n));
}

function parseWidth(w: string | null, fallback: number): number | null {
  if (!w) return null;
  const n = Number.parseInt(w, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return Math.min(MAX_DIM, n);
}

function pickFormat(
  requested: string | null,
  accept: string | null,
  ext: string,
): "jpeg" | "webp" | "avif" {
  // Explicit ?fm= overrides everything
  if (requested === "webp") return "webp";
  if (requested === "avif") return "avif";
  if (requested === "jpeg") return "jpeg";
  if (requested === "png") return "jpeg"; // we never output png (keep jpeg budget)

  // SVG/gif passthrough — never rasterize to a resized jpeg (loses animation/vectors)
  if (ext === "gif" || ext === "svg") return "jpeg";

  // Format negotiation based on Accept header (browser capability)
  const acc = accept?.toLowerCase() ?? "";
  if (acc.includes("image/avif")) return "avif";
  if (acc.includes("image/webp")) return "webp";
  return "jpeg";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = new URL(req.url);

  // Detect signed-URL proxying: /api/storage/object/sign/<bucket>/<file>?token=...
  // (created for content images that were stored with createSignedUrl).
  // Upstream = /storage/v1/object/sign/<bucket>/<file>?token=...
  const isSigned = path[0] === "object" && path[1] === "sign";
  const filePath = isSigned ? path.slice(2).join("/") : path.join("/");

  const token = url.searchParams.get("token");
  let upstream: string;
  if (isSigned) {
    upstream = `${SUPABASE_URL}/storage/v1/object/sign/${filePath}`;
    if (token) upstream += `?token=${encodeURIComponent(token)}`;
  } else {
    upstream = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
  }

  const width = parseWidth(url.searchParams.get("w"), 1920);
  const quality = parseQuality(url.searchParams.get("q"), 80);
  const requestedFm = url.searchParams.get("fm");
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const isImage = IMAGE_EXTS.has(ext);

  // Cache key covers URL params + negotiated format (Accept is cache-busted via Vary)
  const accept = req.headers.get("accept") ?? "";
  const cacheKey = isImage ? `${filePath}|w=${width}|q=${quality}|fm=${requestedFm}|acc=${requestedFm ? "" : accept}` : "";
  const cached = isImage ? cacheGet(cacheKey) : null;
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buf), {
      status: 200,
      headers: {
        "Content-Type": cached.mime,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        ...(cached.vary ? { "Vary": "Accept" } : {}),
        "X-Storage-Cache": "hit",
      },
    });
  }

  // DEV-ONLY STUB: with this machine's ISP the real Storage body never arrives
  // (provider drops it ~70s then 500), which freezes the browser while it waits
  // for layout checks. In development we return a fast local SVG placeholder for
  // IMAGES so the page loads instantly to verify layout/markup. This never runs
  // in production (NODE_ENV !== "development"). Non-image files (video/audio/pdf)
  // still go to the real upstream so their behaviour can still be exercised.
  if (process.env.NODE_ENV === "development" && isImage) {
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.min(width ?? 512, 1024)}" height="240"><rect width="100%" height="100%" fill="#f0e3d0"/><text x="50%" y="50%" fill="#b08968" font-family="Arial" font-size="18" text-anchor="middle" dominant-baseline="middle">placeholder (${ext})</text></svg>`,
    );
    return new NextResponse(new Uint8Array(svg), {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
        "X-Dev-Placeholder": "1",
      },
    });
  }

  try {
    // Present as an anonymous Supabase user: some buckets are readable via the
    // anon RLS policy but NOT opened publicly (key-less GET returns 403).
    // Sending the (public by design) anon key keeps the proxy working for both cases.
    const range = req.headers.get("range");
    const hasRangeHeader = !isImage && !!range;
    let rangeHeader: string | undefined;
    // Non-image (audio/video/pdf) responses are capped to MAX_MEDIA_SLICE in
    // EVERY environment: a bigger response entity gets killed by the Yandex
    // serverless limit (~3.5 MB) => 502/EOF/blank page. The client's range is
    // honored, but its end is clamped to start + MAX_MEDIA_SLICE - 1. A plain
    // GET without Range returns the first slice as 206 with a Content-Range, so
    // players/PDF viewers resume with follow-up range requests. This also keeps
    // dev fast (this ISP drops huge bodies from supabase.co).
    if (!isImage) {
      if (range) {
        const m = /^bytes=(\d+)-(\d+)?$/.exec(range);
        if (m) {
          const start = parseInt(m[1], 10);
          const reqEnd = m[2] ? parseInt(m[2], 10) : Number.MAX_SAFE_INTEGER;
          const end = Math.min(reqEnd, start + MAX_MEDIA_SLICE - 1);
          rangeHeader = `bytes=${start}-${end}`;
        } else {
          rangeHeader = `bytes=0-${MAX_MEDIA_SLICE - 1}`;
        }
      } else {
        rangeHeader = `bytes=0-${MAX_MEDIA_SLICE - 1}`;
      }
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    };

    if (isImage) {
      await acquireImageSlot();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      let resp: Response;
      try {
        resp = await fetch(upstream, { headers, signal: controller.signal, cache: "no-store" });
      } catch (e) {
        clearTimeout(timeoutId);
        if ((e as Error).name === "AbortError") {
          releaseImageSlot();
          return NextResponse.json({ error: "upstream timeout" }, { status: 504 });
        }
        releaseImageSlot();
        throw e;
      }
      clearTimeout(timeoutId);
      if (!resp.ok) {
        releaseImageSlot();
        return NextResponse.json({ error: resp.statusText }, { status: resp.status });
      }
      const buffer = Buffer.from(await resp.arrayBuffer());
      const contentType = EXT_TO_MIME[ext] || resp.headers.get("content-type") || "application/octet-stream";

      let output: Buffer;
      let outMime = contentType;
      let vary = false;
      // Convert animated gif to a static first frame only if a resize is requested.
      let pipeline = sharp(buffer, { animated: ext === "gif" });
      if (width) {
        pipeline = pipeline.resize(width, null, { fit: "inside", withoutEnlargement: true });
      }
      const format = pickFormat(requestedFm, req.headers.get("accept"), ext);
      output = await pipeline
        .rotate()
        .toFormat(format, { quality })
        .toBuffer();
      outMime = format === "webp" ? "image/webp" : format === "avif" ? "image/avif" : "image/jpeg";
      // Only vary on Accept when we're doing format negotiation (no explicit ?fm=)
      vary = !requestedFm;

      if (cacheKey && output.length > 0) {
        cache.set(cacheKey, { buf: output, mime: outMime, vary, ts: Date.now() });
        if (cache.size > 500) {
          // Evict oldest entries when the map grows (keep memory bounded)
          const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts).slice(0, cache.size - 400);
          for (const [k] of oldest) cache.delete(k);
        }
      }

      releaseImageSlot();
      return new NextResponse(new Uint8Array(output), {
        status: 200,
        headers: {
          "Content-Type": outMime,
          // Vary: Accept so format negotiation is cached correctly
          "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          ...(vary ? { "Vary": "Accept" } : {}),
          "X-Storage-Cache": "miss",
        },
      });
    }

    // Non-image (audio/video/pdf/files): read upstream with node's own http
    // client. The Next-patched fetch terminates on Range bodies, and the whole
    // file read must complete before we do anything else (the gateway drops
    // idle upstream connections after ~5s). Media bytes come back as one
    // bounded buffer: in dev capped at 1MB; on prod the requested range (or the
    // full file for plain GETs — our audio files are <=8MB).
    lastStage = "rawGet";
    const got = await rawGetRetryFull(upstream, headers);
    if (!got.ok) {
      return NextResponse.json({ error: got.statusText }, { status: got.statusCode });
    }
    // A plain GET (no Range) must return the COMPLETE document as 200, or the
    // browser's PDF viewer / navigation treats the resource as broken. Files
    // that fit under the serverless response limit are re-fetched whole here;
    // bigger ones stay on the 206 slice below (media players request ranges
    // anyway). In dev media goes to the materialized static file instead.
    if (process.env.NODE_ENV !== "development" && !hasRangeHeader && !isImage) {
      const total = parseTotal(got.headers["content-range"]);
      if (total > 0 && total <= MAX_FULL_RESPONSE) {
        lastStage = "fullGet";
        const full = await rawGetRetryFull(upstream, { Authorization: headers.Authorization ?? "" });
        if (full.ok) {
          return new NextResponse(new Uint8Array(full.buffer), {
            status: 200,
            headers: new Headers({
              "Content-Type": EXT_TO_MIME[ext] || (firstHeader(full.headers, "content-type") ?? "application/octet-stream"),
              "Cache-Control": "public, max-age=3600",
              "Accept-Ranges": "bytes",
              "Content-Length": String(full.buffer.length),
              "x-nf-mode": "full",
            }),
          });
        }
      }
    }
    if (process.env.NODE_ENV !== "development" && !hasRangeHeader && !isImage) {
      const total = parseTotal(got.headers["content-range"]);
      if (total > MAX_FULL_RESPONSE) {
        // Plain browser navigation to a resource too large for a full 200 must
        // not dead-end in a truncated 206 (Chrome's PDF viewer refuses such
        // documents). Answer with a tiny helper page that reconstructs the file
        // from range slices on the client, so arbitrarily large PDFs keep
        // working despite the 3.5MB gateway cap.
        lastStage = "assistHtml";
      const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Файл</title><style>html,body{height:100%;margin:0;background:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}body{display:flex;flex-direction:column;align-items:stretch}#bar{flex:0 0 auto;display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 16px;background:#fff;border-bottom:1px solid #e4e4e7;font-size:14px;color:#3f3f46}#hint{color:#71717a}#dl{display:none;background:#0a9d79;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:14px;cursor:pointer;text-decoration:none}#viewer{flex:1 1 auto;border:0;width:100%;min-height:0}#msg{padding:40px;text-align:center;color:#3f3f46}</style></head><body><div id="bar"><span id="state">Подключение к файлу…</span><span id="hint">Этот файл слишком велик для прямого показа, собираем частями…</span><a id="dl" download>Скачать</a></div><div id="msg"></div><iframe id="viewer" style="display:none" allowfullscreen></iframe><script>(function(){var url=new URL(location.href);var SLICE=1048576;function msg(t){var m=document.getElementById("msg");m.textContent=t;}function state(t,i,n){var s=document.getElementById("state");s.textContent=t+" — "+Math.floor(i*100/n)+"%";}async function run(){var first;try{first=await fetch(url,{headers:{Range:"bytes=0-"+(SLICE-1)}});}catch(e){msg("Не удалось открыть файл (нет соединения). Проверьте интернет и попробуйте ещё раз.");return;}if(!first.ok){msg("Не удалось открыть файл (ошибка "+first.status+").");return;}var m=/bytes 0-\\d+\\/(\\d+)/.exec(first.headers.get("Content-Range")||"");var total=parseInt(m?m[1]:"0",10);if(!total){msg("Не удалось определить размер файла.");return;}var parts=[first.arrayBuffer()];var off=SLICE;while(off<total){state("Загрузка файла",off,total);var r=null;try{r=await fetch(url,{headers:{Range:"bytes="+off+"-"+(off+SLICE-1)}});}catch(e){break;}if(!r.ok){msg("Обрыв загрузки на байте "+off+".");return;}parts.push(r.arrayBuffer());off+=SLICE;}var body=await Promise.all(parts);msg("Готово — открываю…");var blob=new Blob(body,{type:"application/pdf"});var obj=URL.createObjectURL(blob);var name=decodeURIComponent(url.pathname.split("/").pop()||"file.pdf");document.title=name;var v=document.getElementById("viewer");v.src=obj;v.style.display="block";var bar=document.getElementById("hint");bar.textContent="PDF собран из "+body.length+" частей";var dl=document.getElementById("dl");dl.href=obj;dl.download=name;dl.style.display="inline-block";}run();})();<\/script></body></html>`;
      return new NextResponse(html, {
        status: 200,
        headers: new Headers({
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
          "x-nf-mode": "assist",
        }),
      });
      }
    }
    const contentType = EXT_TO_MIME[ext] || (firstHeader(got.headers, "content-type") ?? "application/octet-stream");
    const respStatus = got.statusCode;
    const contentRange = firstHeader(got.headers, "content-range");
    const contentLengthHeader = firstHeader(got.headers, "content-length");
    const firstBuf = got.buffer;

    // DEV build: media elements request with Accept-Encoding: identity, and the
    // Next dev server never delivers the BODY of a dynamic route-handler
    // response for identity requests (headers arrive, body stalls forever) —
    // static assets stream fine. So in dev we materialize the real file in 1MB
    // slices to public/_media/ and redirect (302) to the static URL; playback
    // then works like any static file. First request downloads once, later
    // requests are served from disk instantly. Production keeps this proxy.
    if (process.env.NODE_ENV === "development" && MEDIA_EXTS.has(ext)) {
      const name = filePath.split("/").pop() || "media";
      const dir = `${process.cwd()}/public/_media`;
      const target = `${dir}/${name}`;
      const staticUrl = `/_media/${name}`;
      if (!existsSync(target) && !mediaInflight.has(name)) {
        mediaInflight.add(name);
        try {
          mkdirSync(dir, { recursive: true });
          const tmp = `${target}.part`;
          if (!existsSync(target)) {
            let total = -1;
            let i = 0;
            const step = 1024 * 1024;
            const chunks: Buffer[] = [];
            while (total < 0 || i * step < total) {
              const start = i * step;
              const end = total >= 0 ? Math.min(start + step - 1, total - 1) : start + step - 1;
              const slice = await rawGetRetry(upstream, { Authorization: headers.Authorization }, start, end);
              chunks.push(slice.buffer);
              total = parseTotal(slice.headers["content-range"]);
              i++;
            }
            writeFileSync(tmp, Buffer.concat(chunks));
            renameSync(tmp, target);
          }
          mediaInflight.delete(name);
        } catch (e) {
          mediaInflight.delete(name);
          // materialization failed → fall through to dynamic buffered/stream path
        }
      }
      if (existsSync(target)) {
        return new NextResponse(null, {
          status: 302,
          headers: { Location: staticUrl, "Cache-Control": "no-store" },
        });
      }
    }

    // Non-image fallback (dev, if materialization failed; and prod): serve the
    // already-read upstream bytes with the upstream Range/Content-Range.
    const streamHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Accept-Ranges": "bytes",
      "Vary": "Range",
      "x-nf-mode": "buffer",
    });
    if (contentRange) streamHeaders.set("Content-Range", contentRange);
    if (contentLengthHeader) streamHeaders.set("Content-Length", contentLengthHeader);

    lastStage = "bufferOrStream";
    return new NextResponse(new Uint8Array(firstBuf), { status: respStatus, headers: streamHeaders });
  } catch (e) {
    return NextResponse.json({ error: String(e), stage: lastStage }, { status: 500 });
  }
}

function firstHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const v = headers[key];
  if (v === undefined) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}
