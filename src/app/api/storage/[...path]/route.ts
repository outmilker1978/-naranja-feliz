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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const filePath = path.join("/");
  const upstream = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;

  try {
    const resp = await fetch(upstream);
    if (!resp.ok) {
      return NextResponse.json({ error: resp.statusText }, { status: resp.status });
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentType = EXT_TO_MIME[ext] || resp.headers.get("content-type") || "application/octet-stream";

    let output: Buffer;
    if (IMAGE_EXTS.has(ext)) {
      output = await sharp(buffer)
        .resize(1920, null, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      output = buffer;
    }

    return new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": IMAGE_EXTS.has(ext) ? "image/jpeg" : contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}