"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Dev builds: media elements hang on dynamic route-handler responses (the Next
// dev server never delivers the body for Accept-Encoding: identity), while
// static files under public/ play fine. So in dev we point media at
// /_media/<basename> (materialized locally) and fall back to the proxy URL.
function staticUrlFor(proxyUrl: string): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const base = proxyUrl.split("?")[0].split("/").pop();
  return base ? `/_media/${base}` : null;
}

const memo = new Map<string, Promise<boolean>>();

function ensureMaterialized(proxyUrl: string): Promise<boolean> {
  let p = memo.get(proxyUrl);
  if (!p) {
    p = fetch(`/api/dev/media?path=${encodeURIComponent(proxyUrl)}`)
      .then((r) => r.ok)
      .catch(() => false);
    memo.set(proxyUrl, p);
  }
  return p;
}

export function MediaAsset({
  src,
  variant = "audio",
  className = "",
}: {
  src: string;
  variant?: "audio" | "video";
  className?: string;
}) {
  const staticUrl = staticUrlFor(src);
  const [mode, setMode] = useState<"static" | "proxy">(staticUrl ? "static" : "proxy");
  const [reload, setReload] = useState(0);
  const tried = useRef(false);

  useEffect(() => {
    if (staticUrl) {
      ensureMaterialized(src).then((ok) => setMode(ok ? "static" : "proxy"));
    }
  }, [src, staticUrl]);

  const handleError = useCallback(() => {
    if (mode === "static" && staticUrl && !tried.current) {
      tried.current = true;
      ensureMaterialized(src).then((ok) => {
        tried.current = false;
        if (ok) setReload((x) => x + 1);
        else setMode("proxy");
      });
    } else if (mode === "proxy" && staticUrl) {
      setMode("static");
    }
  }, [mode, staticUrl, src]);

  const Tag = variant === "audio" ? "audio" : "video";
  const finalSrc = mode === "static" && staticUrl ? staticUrl : src;
  return <Tag key={reload} src={finalSrc} controls preload="metadata" className={`w-full ${className}`} onError={handleError} />;
}