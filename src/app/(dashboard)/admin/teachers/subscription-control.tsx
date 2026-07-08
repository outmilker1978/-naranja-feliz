"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscriptionControl({ userId, subscriptionUntil, requestedAt }: { userId: string; subscriptionUntil: string | null; requestedAt: string | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const extend = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/subscription/extend", {
      method: "POST",
      body: JSON.stringify({ studentId: userId }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка");
      setSaving(false);
    }
  };

  const isActive = subscriptionUntil && new Date(subscriptionUntil) > new Date();
  const untilDate = subscriptionUntil ? new Date(subscriptionUntil).toLocaleDateString("ru-RU") : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      {isActive ? (
        <span className="text-[11px] text-green-600">✓ до {untilDate}</span>
      ) : (
        <span className="text-[11px] text-red-500">Нет</span>
      )}
      {requestedAt && (
        <span className="text-[11px] text-yellow-600 bg-yellow-50 px-1.5 rounded">⏳ запрос</span>
      )}
      <button onClick={extend} disabled={saving}
        className="text-[11px] text-primary-500 hover:underline disabled:opacity-50">
        {saving ? "..." : "+30 дней"}
      </button>
      {error && <span className="text-[10px] text-red-500 w-full">{error}</span>}
    </div>
  );
}
