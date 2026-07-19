export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrangeProgress } from "@/components/orange-progress";
import { RequestAccessButton } from "./request-access-button";
import { proxyImgUrl } from "@/lib/image-proxy";

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

  const isOwner = course.created_by === user.id;
  let canAccess = isOwner;
  if (!isOwner && (course.access_mode === "subscription" || course.access_mode === "per_course")) {
    const { data: hasAccess } = await supabase.rpc("check_course_access", { uid: user.id, cid: courseId });
    canAccess = !!hasAccess;
  }

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

  const nextLesson = (lessons ?? []).find(l => lessonStatus(l.id) !== "completed") ?? null;

  return (
    <>
      <div className="border-b border-border/30 bg-white" style={{ position: "fixed", top: "73px", left: 0, right: 0, zIndex: 40 }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 md:px-8 py-2.5">
          <Link href="/courses" className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1">
            ← Все курсы
          </Link>
          {nextLesson && (
            <Link href={`/courses/${courseId}/${nextLesson.id}`}
              className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
              {completedLessons === 0 ? "Первый урок" : "Продолжить"} →
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-14">

      {course.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-zinc-100">
          <img src={proxyImgUrl(course.image_url) ?? ""} alt={course.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>
      )}

      <h1 className="text-2xl font-bold text-accent mb-2">{course.title}</h1>
      {course.description && <p className="text-lg font-semibold text-accent mb-6">{course.description}</p>}

      <div className="flex items-center gap-2 mb-6">
        <span className="badge badge-orange">{course.level}</span>
        {course.access_mode === "subscription" && <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>}
        {course.access_mode === "per_course" && <span className="badge" style={{ background: "#FFF7ED", color: "#C2410C" }}>По запросу</span>}
      </div>

      {!canAccess && (
        <div className="card p-8 text-center mb-8">
          <p className="text-lg text-muted mb-4">Доступ к этому курсу ограничен</p>
          <RequestAccessButton courseId={courseId} />
        </div>
      )}

      {canAccess && (<>

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
              <div className="p-4 flex flex-col sm:flex-row items-start gap-3">
                {lesson.cover_url && (
                  <div className="w-full sm:w-60 h-40 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                    <img src={lesson.cover_url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 group-hover:scale-110 ${
                    status === "completed" ? "bg-primary-500 text-white shadow-sm" : status === "in_progress" ? "bg-primary-200 text-primary-500" : "bg-primary-50 text-primary-400"
                  }`}>
                    {status === "completed" ? "✓" : status === "in_progress" ? <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> : "○"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-accent break-words">{lesson.title}</h3>
                    {(lesson as any).description && <p className="text-base font-semibold text-accent mt-0.5 break-words">{(lesson as any).description}</p>}
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
      </>)}
    </div>
    </>
  );
}