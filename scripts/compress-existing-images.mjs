import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://zphehhzgbudetyzezunk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set in environment");
  process.exit(1);
}

const BUCKET = "lesson-files";
const MAX_WIDTH = 1920;
const QUALITY = 82;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function* listAllFiles(bucket, prefix = "") {
  let startAfter;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 100,
      offset: 0,
      startAfter,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.metadata) {
        yield { name: item.name, path: prefix ? `${prefix}/${item.name}` : item.name, metadata: item.metadata };
      } else {
        yield* listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
    startAfter = data[data.length - 1].name;
  }
}

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".gif"];
const TOTAL_SAVED_PATH = path.join(__dirname, "total-saved.txt");

async function main() {
  console.log(`\n🔍 Listing all files in bucket "${BUCKET}"...\n`);
  const allFiles = [];
  for await (const file of listAllFiles(BUCKET)) {
    const ext = path.extname(file.name).toLowerCase();
    if (IMAGE_EXTS.includes(ext)) {
      allFiles.push(file);
    }
  }
  console.log(`📸 Found ${allFiles.length} image files\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of allFiles) {
    processed++;
    const originalSize = file.metadata.size || 0;
    totalOriginal += originalSize;

    process.stdout.write(`[${processed}/${allFiles.length}] ${file.name} (${(originalSize / 1024).toFixed(1)} KB)... `);

    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(file.path);
      if (error || !data) {
        console.log(`⚠️  download failed`);
        errors++;
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      if (buffer.length < 20480) {
        console.log(`⏭️  too small (<20KB)`);
        skipped++;
        totalCompressed += buffer.length;
        continue;
      }

      let pipeline = sharp(buffer).rotate();
      const meta = await pipeline.metadata();
      if (meta.width && meta.width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, undefined, { fit: "inside", withoutEnlargement: true });
      }

      let compressed;
      if (meta.format === "jpeg") {
        compressed = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
      } else if (meta.format === "png") {
        compressed = await pipeline.png({ quality: QUALITY, compressionLevel: 9, palette: true }).toBuffer();
        if (compressed.length > 500 * 1024) {
          const webpBuf = await sharp(compressed).webp({ quality: QUALITY }).toBuffer();
          if (webpBuf.length < compressed.length) {
            compressed = webpBuf;
          }
        }
      } else {
        compressed = await pipeline.webp({ quality: QUALITY }).toBuffer();
      }

      totalCompressed += compressed.length;
      const saved = ((1 - compressed.length / buffer.length) * 100).toFixed(1);

      if (compressed.length < buffer.length * 0.95) {
        const ext = meta.format === "jpeg" ? "jpg" : meta.format === "png" ? "png" : "webp";
        const newName = file.path.replace(/\.[^.]+$/, `.${ext}`);
        const { error: uploadError } = await supabase.storage.from(BUCKET).update(file.path, compressed, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext === "png" ? "png" : "webp"}`,
          upsert: true,
        });
        if (uploadError) throw uploadError;
        console.log(`✅ saved ${saved}% (${(compressed.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`⏭️  already optimal (${saved}% saved)`);
        skipped++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  const savedBytes = totalOriginal - totalCompressed;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Summary:`);
  console.log(`   Total images: ${allFiles.length}`);
  console.log(`   Processed:    ${processed}`);
  console.log(`   Compressed:   ${processed - skipped - errors}`);
  console.log(`   Skipped:      ${skipped}`);
  console.log(`   Errors:       ${errors}`);
  console.log(`   Original:     ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Compressed:   ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved:        ${(savedBytes / 1024 / 1024).toFixed(2)} MB (${savedBytes > 0 ? ((1 - totalCompressed / totalOriginal) * 100).toFixed(1) : 0}%)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(console.error);
