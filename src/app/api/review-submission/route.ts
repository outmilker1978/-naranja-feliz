import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["teacher", "admin"];
  let isTeacher = allowedRoles.includes(user.user_metadata?.role);
  if (!isTeacher) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isTeacher = profile?.role && allowedRoles.includes(profile.role);
  }
  if (!isTeacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { submissionId, comment, markReviewed } = body;
  if (!submissionId) {
    return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: submission } = await service
    .from("block_submissions")
    .select("student_id, lesson_block_id, lesson_blocks!inner(lesson_id)")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const sub = submission as any;
  const lessonId = sub.lesson_blocks?.lesson_id || sub.lesson_blocks?.[0]?.lesson_id;

  const update: Record<string, any> = {};
  if (comment !== undefined) update.comment = comment?.trim() || null;
  if (markReviewed) update.reviewed = true;

  await service.from("block_submissions").update(update).eq("id", submissionId);

  if (markReviewed || comment?.trim()) {
    const { data: lesson } = await service
      .from("lessons")
      .select("title, course_id, courses!inner(title)")
      .eq("id", lessonId)
      .single();

    const courseTitle = (lesson as any)?.courses?.title || "";
    const link = `/courses/${lesson?.course_id}/${lessonId}`;

    await service.from("notifications").insert({
      user_id: sub.student_id,
      actor_id: user.id,
      title: markReviewed ? `✓ Проверено — ${courseTitle}` : `💬 Комментарий — ${courseTitle}`,
      body: markReviewed
        ? `Твой ответ на «${(lesson as any)?.title}» проверен учителем`
        : `Учитель оставил комментарий к твоему ответу на «${(lesson as any)?.title}»`,
      link,
    });
  }

  return NextResponse.json({ ok: true });
}
