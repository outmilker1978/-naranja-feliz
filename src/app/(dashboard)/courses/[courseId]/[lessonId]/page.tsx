import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LessonContent } from "./lesson-content";
import { BlockRenderer } from "@/components/lesson-blocks/block-renderer";
import { LessonProgressTracker } from "./lesson-progress-tracker";
import { CompleteLessonButton } from "./complete-lesson-button";
import { AutoCompleteLesson } from "./auto-complete-lesson";
import { ClearAnswersButton } from "./clear-answers-button";
import { VocabPickerProvider } from "@/components/vocab-picker-context";
import { VocabPickerFab } from "./vocab-picker-fab";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("created_by, title, access_mode")
    .eq("id", courseId)
    .single();

  const isOwner = course?.created_by === user.id;

  if (!isOwner) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("paid")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment || !enrollment.paid) {
      redirect("/courses");
    }

    // Check subscription only if course is subscription-only
    if (course?.access_mode === "subscription") {
      const { data: subscribed } = await supabase.rpc("check_subscription", { uid: user.id });
      if (!subscribed) {
        redirect("/settings");
      }
    }
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (!lesson) redirect("/courses");

  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, exercises!inner(id)")
    .eq("student_id", user.id);

  const submissionMap = new Map(
    (submissions ?? []).map((s) => [s.exercise_id, s]),
  );

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .single();

  // Fetch all lessons for next/prev navigation
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const currentIdx = (allLessons ?? []).findIndex(l => l.id === lessonId);
  const nextLesson = currentIdx >= 0 && currentIdx < (allLessons ?? []).length - 1
    ? (allLessons ?? [])[currentIdx + 1]
    : null;

  return (
    <>
      {/* Fixed nav */}
      <div className="border-b border-border/30 bg-white" style={{ position: "fixed", top: "73px", left: 0, right: 0, zIndex: 40 }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 md:px-8 py-2.5">
          <Link href={`/courses/${courseId}`} className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1">
            ← {course?.title}
          </Link>
          {nextLesson && (
            <Link href={`/courses/${courseId}/${nextLesson.id}`}
              className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
              Следующий урок →
            </Link>
          )}
        </div>
      </div>

    <div className="max-w-3xl mx-auto pt-14">
      <VocabPickerProvider disabled={!user}>
        <VocabPickerFab lessonId={lessonId} />
        <LessonProgressTracker lessonId={lessonId} studentId={user.id} />
        <AutoCompleteLesson
        lessonId={lessonId}
        studentId={user.id}
        blocks={blocks?.map(b => ({ id: b.id, type: b.type })) ?? []}
        initialCompleted={progress?.completed ?? false}
      />

      {(lesson as any).cover_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-zinc-100">
          <img src={(lesson as any).cover_url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>
      )}

      <h1 className="text-2xl font-bold text-accent mb-2">{lesson.title}</h1>
      {(lesson as any).description && (
        <p className="text-lg font-semibold text-primary-500 mb-6">{(lesson as any).description}</p>
      )}

      <hr className="border-border mb-6" />

      {blocks && blocks.length > 0 ? (
        <div>
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} studentId={user.id} />
          ))}
        </div>
      ) : lesson.content ? (
        <LessonContent
          lesson={lesson}
          exercises={exercises ?? []}
          submissionMap={Object.fromEntries(submissionMap)}
          studentId={user.id}
        />
      ) : (
        <div className="text-center py-12 text-muted">
          <p>В этом уроке пока нет содержимого</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <CompleteLessonButton
          lessonId={lessonId}
          studentId={user.id}
          initialCompleted={progress?.completed ?? false}
        />
        <div className="mt-4">
          <ClearAnswersButton
            lessonId={lessonId}
            studentId={user.id}
            blockIds={blocks?.map(b => b.id) ?? []}
          />
        </div>
      </div>
      </VocabPickerProvider>
    </div>
    </>
  );
}
