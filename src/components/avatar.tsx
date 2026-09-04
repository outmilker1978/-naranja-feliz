"use client";

import { useState } from "react";
import { toProxyPath } from "./storage-image";

const STORAGE_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public";
const STORAGE_SIGN_ORIGIN = "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/sign";

/** Rewrite a storage URL to our proxy path with small avatar-friendly params. */
function avatarProxy(url: string | null | undefined, size: number): string | null {
  if (!url) return null;
  if (url.startsWith("/api/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}w=${size}&q=65&fm=webp`;
  }
  if (url.startsWith(STORAGE_ORIGIN)) {
    return `/api/storage${url.slice(STORAGE_ORIGIN.length)}?w=${size}&q=65&fm=webp`;
  }
  if (url.startsWith(STORAGE_SIGN_ORIGIN)) {
    return `/api/storage/object/sign${url.slice(STORAGE_SIGN_ORIGIN.length)}?w=${size}&q=65&fm=webp`;
  }
  return url;
}

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

/** Profile avatar: storage URLs go through our Sharp proxy at a small width,
 * any failure (or missing image) falls back to the first letter of the name.
 * Fixes slow loading + inconsistent rendering across header/settings/chat. */
export default function Avatar({ src, name, size = 32, className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const proxy = avatarProxy(src, size);
  const showLetter = failed || !proxy || (!proxy.startsWith("/api/storage/") && !/^https?:\/\//.test(proxy));

  if (showLetter) {
    const letter = (name || "?")[0]?.toUpperCase() || "?";
    return (
      <div
        className={`rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)) }}
        aria-label={name || "аватар"}
      >
        {letter}
      </div>
    );
  }

  const proto = toProxyPath(proxy);

  return (
    <img
      src={proto ?? proxy}
      alt={name || ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}