"use client";

import { useEffect } from "react";

// Registers the PWA service worker. Only in production — avoids dev caching/HMR issues.
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* non-fatal */
    });
  }, []);

  return null;
}
