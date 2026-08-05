"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTERACTIVE_TYPES = new Set([
  "choice",
  "fill_blank",
  "open_question",
  "audio_answer",
  "video_answer",
  "drag_order",
  "image_pick",
  "group_drag",
]);

const REVIEW_TYPES = new Set(["open_question", "audio_answer", "video_answer"]);

export function CompleteLessonButton({
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
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const interactive = blocks.filter((b) => INTERACTIVE_TYPES.has(b.type));
    if (interactive.length === 0) {
      setAllDone(true);
      return;
    }

    const check = async () => {
      const { data: submissions } = await supabase
        .from("block_submissions")
        .select("lesson_block_id, reviewed")
        .in("lesson_block_id", interactive.map((b) => b.id))
        .eq("student_id", studentId);

      const subMap = new Map((submissions || []).map((s: any) => [s.lesson_block_id, s]));

      const done = interactive.every((block) => {
        const sub = subMap.get(block.id);
        if (!sub) return false;
        if (REVIEW_TYPES.has(block.type)) return !!sub.reviewed;
        return true;
      });
      setAllDone(done);
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [lessonId, studentId, blocks, supabase]);

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
