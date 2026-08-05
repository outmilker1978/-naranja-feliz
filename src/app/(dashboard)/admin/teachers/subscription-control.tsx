"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscriptionControl({ userId, subscriptionUntil, requestedAt, creditDays }: { userId: string; subscriptionUntil: string | null; requestedAt: string | null; creditDays: number }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const router = useRouter();

  const operate = async (mode: "gift" | "credit" | "writeoff" | "close") => {
    if (mode === "close" && !confirm("Закрыть доступ ученику? Срок обнулится, долг аннулируется.")) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/subscription/extend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: userId, days, mode }),
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
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <div className="flex items-center gap-1">
        {isActive ? (
          <span className="text-[11px] text-green-600">✓ до {untilDate}</span>
        ) : (
          <span className="text-[11px] text-red-500">Нет</span>
        )}
        {creditDays > 0 && (
          <span className="text-[11px] text-red-600 bg-red-50 px-1.5 rounded">долг {creditDays} дн.</span>
        )}
        {requestedAt && (
          <span className="text-[11px] text-yellow-600 bg-yellow-50 px-1.5 rounded">⏳ запрос</span>
        )}
      </div>
      <div className="flex items-center gap-1 w-full">
        <input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={e => setDays(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="w-14 px-1 py-0.5 border border-zinc-300 rounded text-[11px] text-center focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <button onClick={() => operate("gift")} disabled={saving}
          className="text-[11px] text-primary-500 hover:underline disabled:opacity-50">
          {saving ? "..." : "Подарить"}
        </button>
        <button onClick={() => operate("credit")} disabled={saving}
          className="text-[11px] text-amber-600 hover:underline disabled:opacity-50">
          В кредит
        </button>
        {creditDays > 0 && (
          <button onClick={() => operate("writeoff")} disabled={saving}
            className="text-[11px] text-red-500 hover:underline disabled:opacity-50">
            Списать долг
          </button>
        )}
        {(isActive || creditDays > 0) && (
          <button onClick={() => operate("close")} disabled={saving}
            className="text-[11px] text-zinc-400 hover:text-red-500 hover:underline disabled:opacity-50">
            Закрыть доступ
          </button>
        )}
      </div>
      {error && <span className="text-[10px] text-red-500 w-full">{error}</span>}
    </div>
  );
}
