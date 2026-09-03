import Image from "next/image";

const STORAGE_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public";
const STORAGE_SIGN_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/sign";

/** Rewrite a Supabase storage URL (or an already-proxied /api/storage path)
 * to a same-origin proxy path. Returns null for non-storage sources. */
export function toProxyPath(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/storage/")) return url;
  if (url.startsWith(STORAGE_ORIGIN)) return "/api/storage" + url.slice(STORAGE_ORIGIN.length);
  if (url.startsWith(STORAGE_SIGN_ORIGIN)) return "/api/storage/object/sign" + url.slice(STORAGE_SIGN_ORIGIN.length);
  return null;
}

/** True if the source is something our Sharp proxy can safely resize/convert. */
export function isProxyable(url: string | null | undefined): url is string {
  return (
    !!url &&
    (url.startsWith("/api/storage/") ||
      url.startsWith(STORAGE_ORIGIN) ||
      url.startsWith(STORAGE_SIGN_ORIGIN))
  );
}

interface StorageImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  /** Force plain <img> (e.g. external hotlink, gif animation, svg). */
  raw?: boolean;
}

/**
 * Wrapper around next/image. Storage-backed images (Supabase / our proxy) get
 * responsive srcset + lazy loading + layout-shift protection. Anything else
 * (external hotlinks like Google Drive / Yandex Disk, gifs, svg, local assets)
 * falls back to a plain <img> so we never route them through our proxy.
 */
export default function StorageImage({
  src,
  alt = "",
  className,
  sizes,
  priority,
  fill = true,
  width,
  height,
  raw,
}: StorageImageProps) {
  const proxy = toProxyPath(src);

  const useRaw = raw || !isProxyable(src) || !proxy;

  if (useRaw) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src || undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  return (
    <Image
      src={proxy}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
