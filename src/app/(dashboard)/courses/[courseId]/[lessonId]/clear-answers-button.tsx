"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  const clearAll = async () => {
    setLoading(true);
    // 1 RPC вместо 2 запросов + перезагрузки — удаляет ответы и сбрасывает прогресс в одной транзакции
    const { error } = await supabase.rpc("clear_lesson_answers", {
      student_id: studentId,
      lesson_id: lessonId,
    });
    setLoading(false);
    if (error) {
      alert("Не удалось очистить ответы. Попробуйте ещё раз.");
      return;
    }
    setConfirm(false);
    router.refresh();
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