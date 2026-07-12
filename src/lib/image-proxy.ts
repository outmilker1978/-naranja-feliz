const STORAGE_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public";

export function proxyImgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith(STORAGE_ORIGIN)) return url;
  return url.replace(STORAGE_ORIGIN, "/api/storage");
}
