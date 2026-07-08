import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  if (!(p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = svc
    .from("block_submissions")
    .select("id, lesson_block_id, student_id, answer, reviewed, comment, created_at, lesson_blocks!inner(id, lesson_id, type, content), profiles!inner(id, full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  const studentId = searchParams.get("student_id");
  if (studentId) query = query.eq("student_id", studentId);
  const courseId = searchParams.get("course_id");
  if (courseId) query = query.eq("lesson_blocks.lesson.course_id", courseId);
  const dateFrom = searchParams.get("date_from");
  if (dateFrom) query = query.gte("created_at", dateFrom);
  const dateTo = searchParams.get("date_to");
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data: submissions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lessonIds = [...new Set((submissions ?? []).map((s: any) => s.lesson_blocks?.lesson_id).filter(Boolean))];
  const { data: lessons } = await svc.from("lessons").select("id, title, course_id").in("id", lessonIds);
  const lessonMap = new Map((lessons ?? []).map((l: any) => [l.id, l]));

  const courseIds = [...new Set((lessons ?? []).map((l: any) => l.course_id).filter(Boolean))];
  const { data: courses } = await svc.from("courses").select("id, title").in("id", courseIds);
  const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c]));

  const enriched = (submissions ?? []).map((s: any) => {
    const lesson = lessonMap.get(s.lesson_blocks?.lesson_id);
    const course = lesson ? courseMap.get(lesson.course_id) : null;
    return {
      ...s,
      lesson_title: lesson?.title ?? "—",
      course_title: course?.title ?? "—",
    };
  });

  return NextResponse.json(enriched);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  if (!(p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submission_ids, delete_chat, student_ids } = await req.json();
  if (!Array.isArray(submission_ids) || submission_ids.length === 0)
    return NextResponse.json({ error: "No submissions selected" }, { status: 400 });

  if (delete_chat && Array.isArray(student_ids) && student_ids.length > 0) {
    const { data: chats } = await svc
      .from("chats")
      .select("id")
      .in("student_id", student_ids);
    const chatIds = (chats ?? []).map((c: any) => c.id);
    if (chatIds.length > 0) {
      await svc.from("chat_messages").delete().in("chat_id", chatIds);
      await svc.from("chats").delete().in("id", chatIds);
    }
  }

  const { error } = await svc.from("block_submissions").delete().in("id", submission_ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
