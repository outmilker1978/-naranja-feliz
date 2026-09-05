const STORAGE_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public";
const STORAGE_SIGN_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/sign";

export function proxyImgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(STORAGE_ORIGIN)) {
    // public objects -> /api/storage/<bucket>/<file>
    return url.replace(STORAGE_ORIGIN, "/api/storage");
  }
  if (url.startsWith(STORAGE_SIGN_ORIGIN)) {
    // signed URLs (content images): /api/storage/object/sign/<bucket>/<file>?token=...
    return url.replace(STORAGE_SIGN_ORIGIN, "/api/storage/object/sign");
  }
  return url;
}

// Same rewriting for non-image media (audio/video/pdf) — the storage proxy
// passes those through unchanged. Avoids browsers hitting supabase.co directly,
// where providers commonly reset/quic-error and stall the page.
export const proxyFileUrl = proxyImgUrl;

// Rewrites every storage URL inside an HTML string (teacher TipTap content in
// text blocks) to the proxy path, so <img>/<audio>/<video> never load from Supabase.
export function proxyHtmlUrls(html: string): string {
  if (!html) return html;
  let out = html.replaceAll(STORAGE_SIGN_ORIGIN, "/api/storage/object/sign");
  return out.replaceAll(STORAGE_ORIGIN, "/api/storage");
}
