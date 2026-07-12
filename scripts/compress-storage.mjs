import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.local");
const envRaw = readFileSync(envPath, "utf-8");
for (const line of envRaw.split("\n")) {
  const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY);

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
const MAX_SIZE = 1920;
const JPEG_QUALITY = 80;

async function compress(buf) {
  let pipeline = sharp(buf).rotate();
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > MAX_SIZE) {
    pipeline = pipeline.resize(MAX_SIZE, undefined, { fit: "inside", withoutEnlargement: true });
  }
  return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
}

async function processBucket(bucket) {
  let offset = 0;
  const limit = 1000;
  let total = 0, compressed = 0, errors = 0;

  while (true) {
    const { data: files, error } = await svc.storage.from(bucket).list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) { console.error(`List ${bucket} error:`, error); break; }
    if (!files || files.length === 0) break;

    for (const file of files) {
      if (file.id === null) continue;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !IMAGE_EXTS.has(ext)) continue;
      if (file.metadata?.size && file.metadata.size < 300 * 1024) {
        console.log(`  SKIP ${file.name} (${(file.metadata.size / 1024).toFixed(0)}KB) — too small`);
        continue;
      }

      total++;
      try {
        const { data: blob } = await svc.storage.from(bucket).download(file.name);
        if (!blob) { console.log(`  EMPTY ${file.name}`); continue; }
        const originalSize = blob.size;
        const input = Buffer.from(await blob.arrayBuffer());
        const output = await compress(input);
        const savedKB = ((originalSize - output.length) / 1024).toFixed(0);
        const pct = ((1 - output.length / originalSize) * 100).toFixed(0);

        if (output.length < originalSize - 1024) {
          const { error: upErr } = await svc.storage.from(bucket).upload(file.name, output, {
            contentType: "image/jpeg",
            upsert: true,
          });
          if (upErr) throw upErr;
          compressed++;
          console.log(`  OK ${file.name} ${(originalSize / 1024).toFixed(0)}KB → ${(output.length / 1024).toFixed(0)}KB (-${savedKB}KB, ${pct}%)`);
        } else {
          console.log(`  SAME ${file.name} (already small)`);
        }
      } catch (e) {
        errors++;
        console.error(`  ERR ${file.name}: ${e.message}`);
      }
    }
    offset += limit;
  }
  return { total, compressed, errors };
}

async function main() {
  const { data: buckets } = await svc.storage.listBuckets();
  console.log("Buckets:", buckets.map(b => b.name).join(", "));

  for (const bucket of buckets) {
    console.log(`\n=== Bucket: ${bucket.name} ===`);
    const r = await processBucket(bucket.name);
    console.log(`Done: ${r.total} files, ${r.compressed} compressed, ${r.errors} errors`);
  }
}

main().catch(console.error);
