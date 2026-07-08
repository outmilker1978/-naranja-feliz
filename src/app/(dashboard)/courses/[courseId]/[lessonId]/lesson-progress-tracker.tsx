"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function LessonProgressTracker({
  lessonId,
  studentId,
}: {
  lessonId: string;
  studentId: string;
}) {
  const supabase = createClient();

  useEffect(() => {
    const track = async () => {
      const { data: existing } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("lesson_id", lessonId)
        .eq("student_id", studentId)
        .single();

      if (!existing) {
        await supabase.from("lesson_progress").insert({
          lesson_id: lessonId,
          student_id: studentId,
          completed: false,
        });
      }
    };
    track();
  }, [lessonId, studentId]);

  return null;
}
