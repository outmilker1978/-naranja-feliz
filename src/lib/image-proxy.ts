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
