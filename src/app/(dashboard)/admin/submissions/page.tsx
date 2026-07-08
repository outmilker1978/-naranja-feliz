import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SubmissionsList } from "./submissions-list";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const svc = createServiceClient();
  const { data: callerProfile } = await svc.from("profiles").select("role").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(callerProfile?.role === "teacher" || callerProfile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) redirect("/courses");

  const { data: submissions } = await svc
    .from("block_submissions")
    .select("id, lesson_block_id, student_id, answer, reviewed, comment, created_at, lesson_blocks!inner(id, lesson_id, type, content), profiles!inner(id, full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  const { data: lessons } = await svc
    .from("lessons")
    .select("id, title, course_id");

  const courseIds = [...new Set((lessons || []).map((l: any) => l.course_id))];
  const { data: courses } = await svc
    .from("courses")
    .select("id, title")
    .in("id", courseIds);

  const lessonMap = new Map((lessons || []).map((l: any) => [l.id, l]));
  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]));

  const enriched = (submissions || []).map((s: any) => {
    const lesson = lessonMap.get(s.lesson_blocks?.lesson_id) || null;
    const course = lesson ? courseMap.get(lesson.course_id) || null : null;
    return { ...s, lesson, course };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-accent mb-6">Проверка заданий</h1>

      {enriched.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p>Пока нет отправленных заданий</p>
        </div>
      ) : (
        <SubmissionsList submissions={enriched} />
      )}
    </div>
  );
}
