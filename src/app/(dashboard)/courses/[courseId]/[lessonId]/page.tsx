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
    if (course?.access_mode === "per_course" || course?.access_mode === "subscription") {
      const { data: hasCourseAccess } = await supabase.rpc("check_course_access", { uid: user.id, cid: courseId });
      if (!hasCourseAccess) {
        if (course?.access_mode === "subscription") {
          redirect("/settings");
        }
        redirect("/courses");
      }
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("paid")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment || !enrollment.paid) {
      redirect("/courses");
    }
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .single();

  if (!lesson) redirect(`/courses/${courseId}`);

  const isCurrentUserOwner = course?.created_by === user.id;

  if (!isCurrentUserOwner && !lesson.published) {
    redirect(`/courses/${courseId}`);
  }

  const { data: nextLesson } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .eq("published", true)
    .gt("order_index", lesson.order_index)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: prevLesson } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .eq("published", true)
    .lt("order_index", lesson.order_index)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, published")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const { data: lessonBlocks } = await supabase
    .from("lesson_blocks")
    .select("id, type")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  const blockIds = lessonBlocks?.map(b => b.id) ?? [];

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  return (
    <VocabPickerProvider>
      <div className="min-h-screen bg-white">
        <div className="border-b border-border/30 bg-white sticky top-[73px] z-30">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-5 md:px-8 py-2.5">
            <Link href={`/courses/${courseId}`} className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1">
              ← {course?.title}
            </Link>
            <div className="flex items-center gap-2">
              <ClearAnswersButton lessonId={lessonId} studentId={user.id} blockIds={blockIds} />
              <AutoCompleteLesson lessonId={lessonId} studentId={user.id} blocks={lessonBlocks ?? []} initialCompleted={progress?.completed ?? false} />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <LessonContent lesson={lesson} allLessons={allLessons ?? []} prevLesson={prevLesson} nextLesson={nextLesson} />
        </div>
      </div>
      <VocabPickerFab lessonId={lessonId} />
    </VocabPickerProvider>
  );
}