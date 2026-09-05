"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLessonStatus, setLessonProgress } from "@/lib/lesson-api";

export function CompleteLessonButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const status = await getLessonStatus(lessonId);
        if (!mounted) return;
        setAllDone(status.allDone);
        setCompleted(status.completed);
      } catch {
        // Транзиентный сбой — следующий тик повторит.
      }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [lessonId]);

  const toggle = async () => {
    setLoading(true);
    const next = !completed;
    try {
      await setLessonProgress(lessonId, next);
      setCompleted(next);
      router.refresh();
    } catch {
      alert("Не удалось обновить прогресс. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const canToggle = allDone && !loading;

  return (
    <button
      onClick={toggle}
      disabled={!canToggle}
      title={!allDone ? "Выполни все задания в уроке" : undefined}
      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
        completed
          ? "bg-primary-50 text-primary-500 hover:bg-primary-200 border border-primary-300"
          : allDone
            ? "btn-gradient"
            : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
      }`}
    >
      {loading ? "..." : completed ? "🍊 Долька собрана!" : allDone ? "Отметить урок как пройденный" : "Выполни задания, чтобы отметить урок"}
    </button>
  );
}