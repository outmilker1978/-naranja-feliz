"use client";

import { useState } from "react";

export function RequestAccessButton({ courseId }: { courseId: string }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const request = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/course-access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) setDone(true);
    } catch {}
    setSaving(false);
  };

  if (done) {
    return <p className="text-sm text-green-600 font-medium">✓ Запрос отправлен учителю</p>;
  }

  return (
    <button onClick={request} disabled={saving}
      className="btn-gradient btn-lg">
      {saving ? "..." : "Запросить доступ у учителя"}
    </button>
  );
}
