import { NextResponse } from "next/server";
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
    const resp = await fetch(upstream);
    if (!resp.ok) {
      return NextResponse.json({ error: resp.statusText }, { status: resp.status });
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = EXT_TO_MIME[ext] || resp.headers.get("content-type") || "application/octet-stream";

    let output: Buffer;
    let outMime = contentType;
    let vary = false;
    if (isImage) {
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
    } else {
      output = buffer;
    }

    return new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": outMime,
        // Vary: Accept so format negotiation is cached correctly
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        ...(vary ? { "Vary": "Accept" } : {}),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
