"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearLessonAnswers } from "@/lib/lesson-api";
import { Trash2 } from "lucide-react";

export function ClearAnswersButton({
  lessonId,
  studentId,
}: {
  lessonId: string;
  studentId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  const clearAll = async () => {
    setLoading(true);
    try {
      await clearLessonAnswers(lessonId, studentId);
      setConfirm(false);
      router.refresh();
    } catch {
      alert("Не удалось очистить ответы. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} className="text-xs text-zinc-400 hover:text-red-600 transition-colors">
        <Trash2 className="w-3 h-3 inline" /> Очистить все ответы
      </button>
    );
  }

  return (
    <span className="text-xs text-zinc-500">
      Точно очистить?{" "}
      <button onClick={clearAll} disabled={loading} className="text-red-600 hover:underline disabled:opacity-50">
        {loading ? "Очищаю..." : "Да"}
      </button>
      {" / "}
      <button onClick={() => setConfirm(false)} disabled={loading} className="text-zinc-400 hover:underline">Нет</button>
    </span>
  );
}