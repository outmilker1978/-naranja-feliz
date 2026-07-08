import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonBlockId, answer } = await req.json();
  if (!lessonBlockId || answer === undefined) {
    return NextResponse.json({ error: "Missing lessonBlockId or answer" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("block_submissions")
    .upsert(
      { lesson_block_id: lessonBlockId, student_id: user.id, answer },
      { onConflict: "lesson_block_id,student_id" },
    )
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify teacher — fetch course + lesson info for rich notification
  const { data: block } = await svc
    .from("lesson_blocks")
    .select("type, lesson_id, lessons!inner(title, course_id, courses!inner(title, created_by))")
    .eq("id", lessonBlockId)
    .single();

  const course = (block as any)?.lessons?.courses;
  const lessonTitle = (block as any)?.lessons?.title || "";
  const blockType = (block as any)?.type || "";
  if (course && course.created_by !== user.id) {
    const studentName = user.user_metadata?.full_name || user.email || "Ученик";
    const typeLabels: Record<string, string> = {
      choice: "выбор ответа",
      fill_blank: "вставка слова",
      open_question: "открытый вопрос",
      audio_answer: "аудио-ответ",
      video_answer: "видео-ответ",
      drag_order: "порядок слов",
      image_pick: "выбор изображения",
    };
    await svc.from("notifications").insert({
      user_id: course.created_by,
      actor_id: user.id,
      title: `Новый ответ — ${course.title}`,
      body: `${studentName} ответил(а) на «${lessonTitle}» (${typeLabels[blockType] || blockType})`,
      link: `/admin/submissions`,
    });
  }

  return NextResponse.json({ id: data?.id });
}
