import { redirect } from "next/navigation";
import { getServerClient, getCurrentUser } from "@/lib/auth-cache";
import Link from "next/link";
import { BlockRenderer } from "@/components/lesson-blocks/block-renderer";
import type { SavedByBlock } from "@/components/lesson-blocks/types";
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
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await getServerClient();

  // 1 RPC вместо 12 последовательных запросов
  const { data: rpc } = await supabase.rpc("get_lesson_page", {
    uid: user.id,
    cid: courseId,
    lid: lessonId,
  });

  if (!rpc?.lesson) redirect(`/courses/${courseId}`);

  const course = rpc.course;
  const lesson = rpc.lesson;
  const role = rpc.role;
  const isAdmin = role === "admin";
  const isOwner = course?.created_by === user.id;

  if (!isOwner && !isAdmin && !rpc.has_access) {
    redirect("/courses");
  }

  // Неопубликованный урок виден только владельцу и админу (директор/учительский превью)
  if (!isOwner && !isAdmin && !lesson.published) {
    redirect(`/courses/${courseId}`);
  }

  // Навигация: вычисляем prev/next из all_lessons
  const allLessons = rpc.all_lessons ?? [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const lessonBlocks = rpc.blocks ?? [];

  // Преобразуем saved_answers из массива в Record<blockId, submission>
  const savedByBlock: SavedByBlock = {};
  for (const s of rpc.saved_answers ?? []) {
    savedByBlock[s.lesson_block_id] = { id: s.id, answer: s.answer, reviewed: !!s.reviewed, comment: s.comment ?? null };
  }

  const completed = rpc.completed ?? false;

  return (
    <VocabPickerProvider>
      <div className="min-h-screen bg-white">
        <div className="border-b border-border/30 bg-white sticky top-[73px] z-30">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-5 md:px-8 py-2.5">
            <Link href={`/courses/${courseId}`} className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1">
              ← {course?.title}
            </Link>
            <div className="flex items-center gap-2">
              <LessonProgressTracker lessonId={lessonId} studentId={user.id} />
              <AutoCompleteLesson lessonId={lessonId} studentId={user.id} blocks={lessonBlocks} initialCompleted={completed} />
              <ClearAnswersButton lessonId={lessonId} studentId={user.id} />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <h1 className="text-2xl font-bold text-accent mb-6">{lesson.title}</h1>
          {lessonBlocks.map((block: any) => (
            <BlockRenderer key={block.id} block={block} studentId={user.id} savedByBlock={savedByBlock} />
          ))}
          <div className="mt-8 text-center">
            <CompleteLessonButton lessonId={lessonId} studentId={user.id} blocks={lessonBlocks} initialCompleted={completed} />
          </div>
        </div>
      </div>
      <VocabPickerFab lessonId={lessonId} />
    </VocabPickerProvider>
  );
}