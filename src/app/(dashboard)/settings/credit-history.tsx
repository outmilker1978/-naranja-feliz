"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: string;
  type: string;
  typeLabel: string;
  days: number;
  note: string | null;
  created_at: string;
};

export function CreditHistory() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    fetch("/api/subscription/credit-history")
      .then(r => r.json())
      .then(d => setItems(d.history ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return null;

  const colors: Record<string, string> = {
    gift: "text-green-600",
    credit: "text-amber-600",
    payment: "text-blue-600",
    writeoff: "text-red-600",
    close: "text-zinc-500",
  };

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-accent mb-2">История доступа</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted">Записей пока нет</p>
      ) : (
        <div className="space-y-1">
          {items.map(h => (
            <div key={h.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-100">
              <div>
                <span className={`font-medium ${colors[h.type] ?? "text-zinc-600"}`}>{h.typeLabel} · {h.days} дн.</span>
                {h.note && <span className="text-muted"> — {h.note}</span>}
              </div>
              <span className="text-muted shrink-0 ml-2">{new Date(h.created_at).toLocaleDateString("ru-RU")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
