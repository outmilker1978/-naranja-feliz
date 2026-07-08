import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submission_id");
  if (!submissionId) return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });

  const svc = createServiceClient();
  const { data: comments } = await svc
    .from("submission_comments")
    .select("id, submission_id, author_id, text, created_at, profiles!inner(full_name, email, avatar_url)")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionId, text } = await req.json();
  if (!submissionId || !text?.trim()) {
    return NextResponse.json({ error: "Missing submissionId or text" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: comment } = await svc
    .from("submission_comments")
    .insert({ submission_id: submissionId, author_id: user.id, text: text.trim() })
    .select("id, submission_id, author_id, text, created_at")
    .single();

  // Notify teacher when student comments
  const { data: sub } = await svc
    .from("block_submissions")
    .select("lesson_block_id, student_id, lesson_blocks!inner(lesson_id, lessons!inner(title, course_id, courses!inner(title, created_by)))")
    .eq("id", submissionId)
    .single();

  const course = (sub as any)?.lesson_blocks?.lessons?.courses;
  const lessonTitle = (sub as any)?.lesson_blocks?.lessons?.title || "";
  if (course && comment && course.created_by !== user.id) {
    const studentName = user.user_metadata?.full_name || user.email || "Ученик";
    await svc.from("notifications").insert({
      user_id: course.created_by,
      actor_id: user.id,
      title: `Комментарий — ${course.title}`,
      body: `${studentName}: «${text.trim().slice(0, 100)}» — урок «${lessonTitle}»`,
      link: `/admin/submissions`,
    });
  }

  return NextResponse.json({ comment });
}
