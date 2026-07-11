import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import sharp from "sharp";

export const maxDuration = 60;
export const runtime = "nodejs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/tiff"];

async function compressImage(buffer: Buffer, mime: string): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  if (!IMAGE_TYPES.includes(mime)) return { buffer, ext: mime.split("/").pop() || "bin", mime };

  let pipeline = sharp(buffer).rotate();
  const meta = await pipeline.metadata();

  // Resize if wider than 1920px
  if (meta.width && meta.width > 1920) {
    pipeline = pipeline.resize(1920, undefined, { fit: "inside", withoutEnlargement: true });
  }

  // Compress
  if (mime === "image/jpeg") {
    const buf = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return { buffer: buf, ext: "jpg", mime: "image/jpeg" };
  }
  if (mime === "image/png") {
    const buf = await pipeline.png({ quality: 82, compressionLevel: 9, palette: true }).toBuffer();
    // If PNG is still large, convert to webp
    if (buf.length > 500 * 1024) {
      const webpBuf = await sharp(buf).webp({ quality: 82 }).toBuffer();
      if (webpBuf.length < buf.length) return { buffer: webpBuf, ext: "webp", mime: "image/webp" };
    }
    return { buffer: buf, ext: "png", mime: "image/png" };
  }
  // All others → webp
  const buf = await pipeline.webp({ quality: 82 }).toBuffer();
  return { buffer: buf, ext: "webp", mime: "image/webp" };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой. Максимум 10MB." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let uploadBuffer: Buffer = Buffer.from(bytes);
  let contentType = file.type || "application/octet-stream";
  let ext = file.name.split(".").pop() || "bin";

  try {
    const compressed = await compressImage(uploadBuffer, file.type);
    uploadBuffer = Buffer.from(compressed.buffer);
    ext = compressed.ext;
    contentType = compressed.mime;
  } catch {
    // sharp failed — use original file
  }

  const fileName = `uploads/${user.id}/${Date.now()}.${ext}`;

  const service = createServiceClient();
  const { data, error } = await service.storage.from("lesson-files").upload(fileName, uploadBuffer, {
    contentType,
    upsert: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = service.storage.from("lesson-files").getPublicUrl(data.path);
  let url = publicUrl;
  const { data: signedData } = await service.storage.from("lesson-files").createSignedUrl(data.path, 60 * 60 * 24 * 365);
  if (signedData?.signedUrl) {
    url = signedData.signedUrl;
  }

  return NextResponse.json({ url });
}
