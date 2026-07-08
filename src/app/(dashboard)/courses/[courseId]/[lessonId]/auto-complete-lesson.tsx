"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AutoCompleteLesson({
  lessonId,
  studentId,
  blocks,
  initialCompleted,
}: {
  lessonId: string;
  studentId: string;
  blocks: { id: string; type: string }[];
  initialCompleted: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const done = useRef(initialCompleted);

  useEffect(() => {
    if (done.current || blocks.length === 0) return;

    const interactiveBlocks = blocks.filter(
      (b) => b.type === "choice" || b.type === "fill_blank" || b.type === "open_question" || b.type === "audio_answer" || b.type === "video_answer" || b.type === "drag_order" || b.type === "image_pick"
    );
    if (interactiveBlocks.length === 0) return;

    const reviewTypes = new Set(["open_question", "audio_answer", "video_answer"]);

    const check = async () => {
      const { data: submissions } = await supabase
        .from("block_submissions")
        .select("lesson_block_id, reviewed")
        .in("lesson_block_id", interactiveBlocks.map((b) => b.id))
        .eq("student_id", studentId);

      const subMap = new Map((submissions || []).map((s: any) => [s.lesson_block_id, s]));

      const allDone = interactiveBlocks.every((block) => {
        const sub = subMap.get(block.id);
        if (!sub) return false;
        if (reviewTypes.has(block.type)) return !!sub.reviewed;
        return true;
      });

      if (!allDone) return;

      done.current = true;
      await supabase.from("lesson_progress").upsert(
        {
          lesson_id: lessonId,
          student_id: studentId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "lesson_id,student_id" },
      );
      router.refresh();
    };

    check();

    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [lessonId, studentId, blocks, initialCompleted]);

  return null;
}
