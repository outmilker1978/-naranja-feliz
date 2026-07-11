"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export function ClearAnswersButton({
  lessonId,
  studentId,
  blockIds,
}: {
  lessonId: string;
  studentId: string;
  blockIds: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const supabase = createClient();

  const clearAll = async () => {
    setLoading(true);
    await supabase
      .from("block_submissions")
      .delete()
      .in("lesson_block_id", blockIds)
      .eq("student_id", studentId);
    await supabase
      .from("lesson_progress")
      .upsert(
        { lesson_id: lessonId, student_id: studentId, completed: false, completed_at: null },
        { onConflict: "lesson_id,student_id" },
      );
    window.location.reload();
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
        {loading ? "..." : "Да"}
      </button>
      {" / "}
      <button onClick={() => setConfirm(false)} className="text-zinc-400 hover:underline">Нет</button>
    </span>
  );
}
