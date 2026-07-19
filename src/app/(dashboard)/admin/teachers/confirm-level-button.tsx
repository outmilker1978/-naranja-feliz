"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function LevelControl({ userId, currentLevel, confirmed }: { userId: string; currentLevel: string | null; confirmed: boolean }) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(currentLevel ?? "");
  const router = useRouter();

  const setLevel = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/confirm-language-level", {
      method: "POST",
      body: JSON.stringify({ userId, level: selected }),
    });
    setSaving(false);
    router.refresh();
  };

  if (confirmed && selected === currentLevel) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs bg-primary-50 text-primary-500 px-1.5 py-0.5 rounded font-medium">{currentLevel}</span>
        <span className="text-[10px] text-green-600">✓ Подтверждён</span>
        <button onClick={() => setSelected("")}
          className="text-[10px] text-primary-500 hover:underline ml-1">
          Изменить
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <select value={selected} onChange={e => setSelected(e.target.value)}
        className="text-xs border border-zinc-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-400">
        <option value="">— Уровень —</option>
        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <button onClick={setLevel} disabled={saving || !selected}
        className="text-[10px] text-primary-500 hover:underline disabled:opacity-50">
        {saving ? "..." : currentLevel ? "Подтвердить" : "Установить"}
      </button>
    </div>
  );
}
