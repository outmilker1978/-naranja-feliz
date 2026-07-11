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
    <>
      <div className="border-b border-border/30 bg-white" style={{ position: "fixed", top: "73px", left: 0, right: 0, zIndex: 40 }}>
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 px-4 sm:px-8 py-2.5 text-sm">
          <Link href="/admin/courses" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors whitespace-nowrap">Курсы</Link>
          <span className="text-muted/40">→</span>
          <Link href={`/admin/courses/${course.id}`} className="text-muted hover:text-accent transition-colors truncate">{course.title}</Link>
          <span className="text-muted/40">→</span>
          <span className="text-accent/70 font-medium truncate">{lesson.title}</span>
        </div>
      </div>

    <div className="pt-14">
      <div className="mb-6">
        <LessonActions lessonId={lesson.id} courseId={course.id} published={(lesson as any).published ?? false} title={lesson.title} courseTitle={course.title} coverUrl={(lesson as any).cover_url ?? null} description={(lesson as any).description ?? null} />
      </div>

      <BlocksEditor
        lessonId={lesson.id}
        initialBlocks={blocks ?? []}
      />
    </div>
    </>
  );
}
