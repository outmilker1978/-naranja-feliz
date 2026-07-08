"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CompleteLessonButton({
  lessonId,
  studentId,
  initialCompleted,
}: {
  lessonId: string;
  studentId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    const next = !completed;

    if (next) {
      await supabase.from("lesson_progress").upsert(
        { lesson_id: lessonId, student_id: studentId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: "lesson_id,student_id" },
      );
    } else {
      await supabase.from("lesson_progress").upsert(
        { lesson_id: lessonId, student_id: studentId, completed: false, completed_at: null },
        { onConflict: "lesson_id,student_id" },
      );
    }

    setCompleted(next);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
        completed
          ? "bg-primary-50 text-primary-500 hover:bg-primary-200 border border-primary-300"
          : "btn-gradient"
      }`}
    >
      {loading ? "..." : completed ? "🍊 Долька собрана!" : "Отметить урок как пройденный"}
    </button>
  );
}
