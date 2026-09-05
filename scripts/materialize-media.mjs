// DEV-ONLY helper: downloads a supabase storage object locally in 1MB slices
// (the dev ISP drops single large bodies) so dev mode can serve media from
// /_media as a plain static file (identity/range behaviour works, unlike the
// dynamic route handler in Next dev).
// Usage: node scripts/materialize-media.mjs <upstreamObjectUrl> <targetFile>
// Upstream URL must already include the auth token if the object is signed.
import fs from "node:fs";
import path from "node:path";

const [upstream, target] = process.argv.slice(2);
if (!upstream || !target) {
  console.error("usage: node scripts/materialize-media.mjs <url> <target>");
  process.exit(2);
}
const anon = process.env.NF_ANON ?? "";
const step = 1024 * 1024;
const parts = [];
let total = -1;
let i = 0;

async function slice(start, end, attempts = 6) {
  let lastErr;
  for (let a = 0; a < attempts; a++) {
    try {
      const r = await fetch(upstream, {
        headers: { Authorization: `Bearer ${anon}`, Range: `bytes=${start}-${end}` },
      });
      if (r.status !== 206) throw new Error(`status ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const m = /bytes \d+-\d+\/(\d+)/.exec(r.headers.get("content-range") || "");
      return { buf, total: m ? Number.parseInt(m[1], 10) : -1 };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 900));
    }
  }
  throw lastErr ?? new Error("slice failed");
}

try {
  while (total < 0 || i * step < total) {
    const start = i * step;
    const end = total >= 0 ? Math.min(start + step - 1, total - 1) : start + step - 1;
    const s = await slice(start, end);
    parts.push(s.buf);
    total = s.total;
    i++;
  }
  const buf = Buffer.concat(parts);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(`${target}.part`, buf);
  fs.renameSync(`${target}.part`, target);
  console.log(`OK ${target} bytes=${buf.length} expected=${total}`);
} catch (e) {
  console.error(`FAIL ${String(e)}`);
  process.exit(1);
}