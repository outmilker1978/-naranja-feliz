"use client";

import { useEffect } from "react";
import { getLessonStatus, setLessonProgress } from "@/lib/lesson-api";

export function LessonProgressTracker({
  lessonId,
}: {
  lessonId: string;
}) {
  useEffect(() => {
    const track = async () => {
      try {
        const status = await getLessonStatus(lessonId);
        // Создаём строку прогресса при первом открытии урока.
        if (!status.hasProgressRow) {
          await setLessonProgress(lessonId, false);
        }
      } catch {
        // Транзиентный сбой — прогресс создастся при следующем действии.
      }
    };
    track();
  }, [lessonId]);

  return null;
}