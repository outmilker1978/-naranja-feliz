import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { logError } from "../logger";

// Robust Supabase HTTP layer (server-side):
// 1) Timeout — a stalled connection fails fast instead of hanging 20-70s.
// 2) Retry once for READ (GET) calls only, to recover from transient network stalls
//    WITHOUT risking duplicate mutations (POST/PATCH/DELETE are never auto-retried).
// 3) `Connection: close` — avoid reusing stale keep-alive sockets that caused the hangs.
const SUPABASE_TIMEOUT_MS = 12_000;
const RETRY_DELAY_MS = 300;

export const supabaseFetch: typeof fetch = async (input, init = {}) => {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (!headers.has("connection")) headers.set("connection", "close");

  const attempts = method === "GET" ? 2 : 1;
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
    try {
      return await fetch(input, { ...init, headers, signal: controller.signal });
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  const finalErr = lastErr ?? new Error("supabaseFetch failed");
  logError("supabase", `request failed(${method}) after ${attempts} attempt(s)`, finalErr, {
    url: typeof input === "string" ? input : "complex",
  });
  throw finalErr;
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: supabaseFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: { fetch: supabaseFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: supabaseFetch } },
  );
}
