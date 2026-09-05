import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Keep-alive endpoint used by the external warm-up cron (keep-warm.yml).
// Deliberately does NOT touch Supabase — it only verifies the container is up,
// so the ping stays cheap even under a cloudy first request.
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}