"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLessonStatus, setLessonProgress } from "@/lib/lesson-api";

export function AutoCompleteLesson({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const done = useRef(initialCompleted);

  useEffect(() => {
    if (done.current) return;

    const check = async () => {
      try {
        const status = await getLessonStatus(lessonId);
        if (!status.allDone) return;

        done.current = true;
        await setLessonProgress(lessonId, true);
        router.refresh();
      } catch {
        // Транзиентный сетевой сбой — следующий тик повторит проверку.
      }
    };

    check();

    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [lessonId, initialCompleted, router]);

  return null;
}