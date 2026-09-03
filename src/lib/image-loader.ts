"use client";

const STORAGE_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public";
const STORAGE_SIGN_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/sign";

/**
 * Custom image loader routing every optimized request through our Sharp proxy
 * (/api/storage/...). The proxy is the single entry point that (a) bypasses
 * Supabase Storage provider quirks and (b) resizes/converts on demand.
 *
 * - URLs already on /api/storage/... -> append ?w= & ?q=
 * - Supabase storage URLs           -> rewrite to /api/storage/... + ?w= & ?q=
 * - Static public assets (/logo... etc) and absolute external URLs -> returned as-is.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src) return src;

  // External absolute URLs (Google Drive, Yandex Disk, hotlinks) — serve untouched.
  if (/^https?:\/\//.test(src)) {
    if (src.startsWith(STORAGE_ORIGIN)) {
      return "/api/storage" + src.slice(STORAGE_ORIGIN.length) + `?w=${width}&q=${quality || 80}`;
    }
    if (src.startsWith(STORAGE_SIGN_ORIGIN)) {
      // Preserve the token query while appending sizing params.
      const rest = src.slice(STORAGE_SIGN_ORIGIN.length); // /<bucket>/<file>?token=...
      const sep = rest.includes("?") ? "&" : "?";
      return "/api/storage/object/sign" + rest + `${sep}w=${width}&q=${quality || 80}`;
    }
    return src;
  }

  // Already proxied -> append sizing params
  if (src.startsWith("/api/storage/")) {
    const sep = src.includes("?") ? "&" : "?";
    return src + `${sep}w=${width}&q=${quality || 80}`;
  }

  // Root-relative public assets (logo, favicon, svg) -> keep as-is
  if (src.startsWith("/")) {
    return src;
  }

  // Fallback
  return src;
}
