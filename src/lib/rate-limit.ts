// Lightweight in-memory sliding-window rate limiter (server-side).
// Note: with multiple serverless instances the limit is per-instance (approximate),
// which is fine for small/medium traffic. High thresholds so normal use is unaffected.
import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

// Map<key, Bucket> — key = `${route}:${ip}`. Cleanup lazy.
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  notify?: boolean;
}

export function checkRateLimit(ip: string, route: string, opts: RateLimitOptions): boolean {
  const key = `${route}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }

  b.count++;
  if (b.count > opts.max) {
    return false;
  }
  return true;
}

export function rateLimited(route: string): NextResponse {
  return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
}
