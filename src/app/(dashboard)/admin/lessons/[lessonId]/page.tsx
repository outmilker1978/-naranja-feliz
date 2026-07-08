import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BlocksEditor } from "@/components/lesson-blocks/blocks-editor";
import { LessonActions } from "./lesson-actions";

export default async function LessonEditPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const svc = createServiceClient();
  const { data: callerProfile } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const metaRole = user.user_metadata?.role;
  if (!(callerProfile?.role === "teacher" || callerProfile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) redirect("/courses");

  const { data: lesson } = await svc
    .from("lessons")
    .select("*, courses!inner(id, created_by, title)")
    .eq("id", lessonId)
    .single();

  if (!lesson) redirect("/admin/courses");

  const course = lesson.courses as unknown as { id: string; created_by: string; title: string };
  if (course.created_by !== user.id) redirect("/admin/courses");

  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  return (
    <div>
      <nav className="text-sm text-muted mb-4">
        <Link href="/admin/courses" className="hover:text-secondary">Курсы</Link>
        <span className="mx-2">→</span>
        <Link href={`/admin/courses/${course.id}`} className="hover:text-secondary">{course.title}</Link>
        <span className="mx-2">→</span>
        <span className="text-accent">{lesson.title}</span>
      </nav>

      <div className="mb-6">
        <LessonActions lessonId={lesson.id} courseId={course.id} published={(lesson as any).published ?? false} title={lesson.title} courseTitle={course.title} coverUrl={(lesson as any).cover_url ?? null} description={(lesson as any).description ?? null} />
      </div>

      <BlocksEditor
        lessonId={lesson.id}
        initialBlocks={blocks ?? []}
      />
    </div>
  );
}
