import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrangeProgress } from "@/components/orange-progress";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const viewRole = cookieStore.get("view_role")?.value;

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  if (course.created_by === user.id && viewRole !== "student") {
    redirect(`/admin/courses/${courseId}`);
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("paid")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (!enrollment || !enrollment.paid) redirect("/courses");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const { data: progressRecords } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", user.id);

  const progressMap = new Map(
    (progressRecords ?? []).map((p) => [p.lesson_id, p]),
  );

  function lessonStatus(lessonId: string) {
    const p = progressMap.get(lessonId);
    if (!p) return "not_started";
    if (p.completed) return "completed";
    return "in_progress";
  }

  const totalLessons = lessons?.length ?? 0;
  const completedLessons = (lessons ?? []).filter(l => lessonStatus(l.id) === "completed").length;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/courses" className="text-sm font-semibold text-primary-500 mb-4 inline-block">
        ← Все курсы
      </Link>

      {course.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-zinc-100">
          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>
      )}

      <h1 className="text-2xl font-bold text-accent mb-2">{course.title}</h1>
      {course.description && <p className="text-lg font-semibold text-accent mb-6">{course.description}</p>}

      <div className="flex items-center gap-2 mb-6">
        <span className="badge badge-orange">{course.level}</span>
      </div>

      {/* Progress bar */}
      {totalLessons > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted mb-2">
            <span>Прогресс:</span>
            <span>{completedLessons} из {totalLessons}</span>
          </div>
          <OrangeProgress completed={completedLessons} total={totalLessons} size="md" />
        </div>
      )}

      <h2 className="text-lg font-semibold text-accent mb-4">Уроки</h2>

      {(!lessons || lessons.length === 0) && (
        <div className="text-center py-12 text-muted">
          <p>В этом курсе пока нет уроков</p>
        </div>
      )}

      <div className="space-y-3">
        {lessons?.map((lesson, i) => {
          const status = lessonStatus(lesson.id);
          return (
            <Link
              key={lesson.id}
              href={`/courses/${courseId}/${lesson.id}`}
              className="group block card overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-4 flex items-start gap-3">
                {lesson.cover_url && (
                  <div className="w-60 h-40 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                    <img src={lesson.cover_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 group-hover:scale-110 ${
                    status === "completed" ? "bg-primary-500 text-white shadow-sm" : status === "in_progress" ? "bg-primary-200 text-primary-500" : "bg-primary-50 text-primary-400"
                  }`}>
                    {status === "completed" ? "✓" : status === "in_progress" ? <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> : "○"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-accent">{lesson.title}</h3>
                    {(lesson as any).description && <p className="text-base font-semibold text-accent mt-0.5">{(lesson as any).description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${
                        status === "completed" ? "badge-orange" : status === "in_progress" ? "badge-orange" : "badge-gray"
                      }`}>
                        {status === "completed" ? "пройдено" : status === "in_progress" ? "в процессе" : "не начат"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
