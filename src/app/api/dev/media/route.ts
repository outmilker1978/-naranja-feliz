import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const SUPABASE_URL = "https://zphehhzgbudetyzezunk.supabase.co";

// DEV-ONLY: ensure the storage media file behind a proxy URL is materialized to
// public/_media/<basename> (so <audio>/<video> can load it from a static URL,
// which the Next dev server actually delivers for media requests). Downloads
// happen in a separate node process via 1MB slices — inside Next's runtime the
// same fetch is unreliable. In production this route does not exist.
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "dev-only" }, { status: 404 });
  }
  const url = new URL(req.url);
  const proxyUrl = url.searchParams.get("path");
  if (!proxyUrl) return NextResponse.json({ ok: false, error: "path missing" }, { status: 400 });

  // proxyUrl like /api/storage/<bucket>/<file> or /api/storage/object/sign/<bucket>/<file>?token=...
  let rest = proxyUrl.replace(/^\//, "");
  let signToken: string | null = null;
  if (rest.startsWith("api/storage/object/sign/")) {
    rest = rest.slice("api/storage/object/sign/".length);
    const qt = proxyUrl.indexOf("?token=");
    if (qt >= 0) signToken = proxyUrl.slice(qt + "?token=".length);
  } else if (rest.startsWith("api/storage/")) {
    rest = rest.slice("api/storage/".length);
  } else {
    return NextResponse.json({ ok: false, error: "not a storage proxy URL" }, { status: 400 });
  }
  const name = rest.split("/").pop();
  if (!name) return NextResponse.json({ ok: false, error: "bad path" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "_media");
  const target = path.join(dir, name);
  if (existsSync(target)) return NextResponse.json({ ok: true });

  const storageObject = `${SUPABASE_URL}/storage/v1/object/sign/${rest}`;
  const upstream = signToken ? `${storageObject}?token=${encodeURIComponent(signToken)}` : `${SUPABASE_URL}/storage/v1/object/public/${rest}`;

  try {
    await new Promise<void>((resolve, reject) => {
      const script = path.join(process.cwd(), "scripts", "materialize-media.mjs");
      execFile(
        "node",
        [script, upstream, target],
        { env: { ...process.env, NF_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" }, timeout: 150000 },
        (err) => (existsSync(target) ? resolve() : reject(err ?? new Error("materialize failed"))),
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}