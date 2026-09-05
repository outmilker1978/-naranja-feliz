import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getServerClient } from "@/lib/auth-cache";

const INTERACTIVE_TYPES = new Set([
  "choice",
  "fill_blank",
  "open_question",
  "audio_answer",
  "video_answer",
  "drag_order",
  "image_pick",
  "group_drag",
  "memory",
]);

const REVIEW_TYPES = new Set(["open_question", "audio_answer", "video_answer"]);

export const dynamic = "force-dynamic";

// BFF: прогресс и полнота ответов урока для клиентских компонентов
// (auto-complete, кнопка «пройден», трекер). Браузер больше не ходит в Supabase.
// Статус считается ровно по той же логике, что была в клиентских компонентах.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const supabase = await getServerClient();

  const { data: blocks, error: blocksError } = await supabase
    .from("lesson_blocks")
    .select("id, type")
    .eq("lesson_id", lessonId);
  if (blocksError) return NextResponse.json({ error: blocksError.message }, { status: 500 });

  const interactive = (blocks ?? []).filter((b: any) => INTERACTIVE_TYPES.has(b.type));
  const interactiveIds = interactive.map((b: any) => b.id);

  const [subsRes, progressRes] = await Promise.all([
    supabase
      .from("block_submissions")
      .select("lesson_block_id, reviewed")
      .in("lesson_block_id", interactiveIds)
      .eq("student_id", user.id),
    supabase
      .from("lesson_progress")
      .select("completed")
      .eq("lesson_id", lessonId)
      .eq("student_id", user.id)
      .maybeSingle(),
  ]);

  if (subsRes.error) return NextResponse.json({ error: subsRes.error.message }, { status: 500 });
  if (progressRes.error) return NextResponse.json({ error: progressRes.error.message }, { status: 500 });

  const subMap = new Map(
    (subsRes.data ?? []).map((s: any) => [s.lesson_block_id, s.reviewed]),
  );

  const allDone = interactive.every((block: any) => {
    const reviewed = subMap.get(block.id);
    if (reviewed === undefined) return false;
    if (REVIEW_TYPES.has(block.type)) return !!reviewed;
    return true;
  });

  return NextResponse.json({
    hasProgressRow: !!progressRes.data,
    completed: !!progressRes.data?.completed,
    allDone,
  });
}