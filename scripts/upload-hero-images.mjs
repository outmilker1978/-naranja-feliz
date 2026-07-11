import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, parse } from "path";

const supabaseUrl = "https://zphehhzgbudetyzezunk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const bucket = "hero";
const bgDir = join(import.meta.dirname, "..", "public", "images", "bg");

async function main() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === bucket);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error) throw error;
    console.log(`Bucket "${bucket}" created`);
  } else {
    console.log(`Bucket "${bucket}" already exists`);
  }

  const files = readdirSync(bgDir).filter((f) => f.endsWith(".jpg"));
  for (const file of files) {
    const filePath = join(bgDir, file);
    const content = readFileSync(filePath);
    const { error } = await supabase.storage.from(bucket).upload(file, content, { upsert: true });
    if (error) {
      console.error(`FAIL ${file}: ${error.message}`);
    } else {
      console.log(`OK   ${file}`);
    }
  }

  const { data: uploaded } = await supabase.storage.from(bucket).list();
  console.log(`\nUploaded ${uploaded?.length ?? 0} files`);
  console.log("\nSupabase URLs:");
  for (const f of uploaded ?? []) {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(f.name);
    console.log(publicUrl);
  }
}

main().catch(console.error);
