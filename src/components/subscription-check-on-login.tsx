"use client";

import { useEffect } from "react";

export function SubscriptionCheckOnLogin() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/check", { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.stage) {
          console.info("[subscription] reminder stage:", data.stage, { created: data.created, emailed: data.emailed, emailError: data.emailError });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
